"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferService = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createOfferSchema = zod_1.z.object({
    offerPrice: zod_1.z.number().positive(),
    earnestMoney: zod_1.z.number().positive().optional(),
});
const stubChecks = [
    { checkType: "JUSTICA_FEDERAL", status: "CLEAR", resultSummary: "Sem pendencias (stub)" },
    { checkType: "TRABALHISTA", status: "CLEAR", resultSummary: "Sem pendencias (stub)" },
    { checkType: "MATRICULA", status: "CLEAR", resultSummary: "Matricula consistente (stub)" },
];
class OfferService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOffer(buyerUserId, listingId, payload) {
        const input = createOfferSchema.parse(payload);
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: { property: true },
        });
        if (!listing || listing.status !== "PUBLISHED") {
            throw new Error("LISTING_NOT_AVAILABLE");
        }
        if (listing.sellerUserId === buyerUserId) {
            throw new Error("SELF_OFFER");
        }
        const existing = await this.prisma.offer.findFirst({
            where: {
                listingId,
                buyerUserId,
                status: "SUBMITTED",
            },
        });
        if (existing) {
            throw new Error("OFFER_ALREADY_OPEN");
        }
        const earnest = input.earnestMoney ??
            Math.min(Math.round(input.offerPrice * 0.05 * 100) / 100, input.offerPrice);
        return this.prisma.offer.create({
            data: {
                listingId,
                buyerUserId,
                offerPrice: new client_1.Prisma.Decimal(input.offerPrice),
                earnestMoney: new client_1.Prisma.Decimal(earnest),
                status: "SUBMITTED",
            },
            include: { listing: { include: { property: true } } },
        });
    }
    async acceptOffer(sellerUserId, offerId) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                listing: { include: { property: true } },
                buyer: { include: { profile: true } },
            },
        });
        if (!offer) {
            throw new Error("OFFER_NOT_FOUND");
        }
        if (offer.listing.sellerUserId !== sellerUserId) {
            throw new Error("NOT_YOUR_LISTING");
        }
        if (offer.status !== "SUBMITTED") {
            throw new Error("OFFER_NOT_SUBMITTED");
        }
        const seller = await this.prisma.user.findUnique({
            where: { id: sellerUserId },
            include: { profile: true },
        });
        if (!seller?.profile || !offer.buyer.profile) {
            throw new Error("PROFILE_MISSING");
        }
        const contractBody = this.buildContractDraft({
            buyerName: offer.buyer.profile.fullName,
            sellerName: seller.profile.fullName,
            property: offer.listing.property,
            offerPrice: offer.offerPrice.toString(),
            earnestMoney: offer.earnestMoney.toString(),
        });
        return this.prisma.$transaction(async (tx) => {
            await tx.offer.updateMany({
                where: {
                    listingId: offer.listingId,
                    id: { not: offerId },
                    status: "SUBMITTED",
                },
                data: { status: "REJECTED" },
            });
            const accepted = await tx.offer.update({
                where: { id: offerId },
                data: { status: "ACCEPTED" },
            });
            await tx.listing.update({
                where: { id: offer.listingId },
                data: { status: "UNDER_OFFER" },
            });
            const ddCase = await tx.dueDiligenceCase.create({
                data: {
                    offerId: accepted.id,
                    status: "APPROVED",
                    riskScore: 12,
                    checks: {
                        create: stubChecks,
                    },
                },
                include: { checks: true },
            });
            await tx.contract.create({
                data: {
                    offerId: accepted.id,
                    status: "DRAFT",
                    bodyMarkdown: contractBody,
                },
            });
            const escrow = await tx.escrowAccount.create({
                data: {
                    offerId: accepted.id,
                    status: "PENDING_FUNDING",
                    targetAmount: accepted.earnestMoney,
                    milestones: {
                        create: [
                            { milestoneType: "DUE_DILIGENCE", status: "DONE" },
                            { milestoneType: "CONTRACT_SIGNED", status: "PENDING" },
                            { milestoneType: "REGISTRY", status: "PENDING" },
                        ],
                    },
                },
                include: { milestones: true },
            });
            return { accepted, ddCase, escrow };
        });
    }
    async getPipelineForUser(offerId, userId) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                listing: { include: { property: true, valuationSnapshot: true } },
                dueDiligenceCase: { include: { checks: true } },
                contract: true,
                escrowAccount: { include: { milestones: true } },
            },
        });
        if (!offer) {
            throw new Error("OFFER_NOT_FOUND");
        }
        if (offer.buyerUserId !== userId && offer.listing.sellerUserId !== userId) {
            throw new Error("FORBIDDEN");
        }
        return offer;
    }
    async listMine(buyerUserId) {
        return this.prisma.offer.findMany({
            where: { buyerUserId },
            orderBy: { createdAt: "desc" },
            include: { listing: { include: { property: true, valuationSnapshot: true } } },
        });
    }
    /** Simula webhook de BaaS: deposito do sinal completo (somente MVP / ambiente de demo). */
    async simulateEscrowFunding(offerId, userId) {
        const offer = await this.prisma.offer.findUnique({
            where: { id: offerId },
            include: { listing: true, escrowAccount: true },
        });
        if (!offer?.escrowAccount) {
            throw new Error("ESCROW_NOT_READY");
        }
        if (offer.buyerUserId !== userId && offer.listing.sellerUserId !== userId) {
            throw new Error("FORBIDDEN");
        }
        if (offer.status !== "ACCEPTED") {
            throw new Error("OFFER_NOT_ACCEPTED");
        }
        return this.prisma.escrowAccount.update({
            where: { id: offer.escrowAccount.id },
            data: {
                status: "FUNDED",
                fundedAmount: offer.escrowAccount.targetAmount,
                externalRef: `sim_${offerId.slice(0, 8)}`,
            },
        });
    }
    buildContractDraft(input) {
        return [
            "# Compromisso de Compra e Venda (rascunho gerado pelo MVP)",
            "",
            `**Imovel:** ${input.property.addressLine1}, ${input.property.city}/${input.property.state}`,
            `**Preco acordado:** R$ ${input.offerPrice}`,
            `**Sinal (conta garantia - alvo):** R$ ${input.earnestMoney}`,
            "",
            `**Comprador:** ${input.buyerName}`,
            `**Vendedor:** ${input.sellerName}`,
            "",
            "_Documento para demonstracao. Integracao com assinatura (DocuSign/Gov.br) na proxima etapa._",
        ].join("\n");
    }
}
exports.OfferService = OfferService;
