"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingService = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const compute_valuation_1 = require("../valuation/compute-valuation");
const createListingSchema = zod_1.z.object({
    propertyType: zod_1.z.string().min(1),
    addressLine1: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().min(2).max(2),
    zipCode: zod_1.z.string().min(1),
    areaM2: zod_1.z.number().positive().optional(),
    bedrooms: zod_1.z.number().int().nonnegative().optional(),
    parkingSpots: zod_1.z.number().int().nonnegative().optional(),
    askingPrice: zod_1.z.number().positive(),
    estimatedMonthlyRent: zod_1.z.number().positive().optional(),
    regionalPriceCeilingPerM2: zod_1.z.number().positive().optional(),
    status: zod_1.z.enum(["DRAFT", "PUBLISHED"]).optional().default("PUBLISHED"),
});
const listingInclude = {
    property: true,
    valuationSnapshot: true,
};
class ListingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createForSeller(sellerUserId, payload) {
        const input = createListingSchema.parse(payload);
        return this.prisma.$transaction(async (tx) => {
            const property = await tx.property.create({
                data: {
                    sellerUserId,
                    propertyType: input.propertyType,
                    addressLine1: input.addressLine1,
                    city: input.city,
                    state: input.state,
                    zipCode: input.zipCode,
                    areaM2: input.areaM2,
                    bedrooms: input.bedrooms,
                    parkingSpots: input.parkingSpots,
                },
            });
            const listing = await tx.listing.create({
                data: {
                    propertyId: property.id,
                    sellerUserId,
                    askingPrice: new client_1.Prisma.Decimal(input.askingPrice),
                    status: input.status,
                    publishedAt: input.status === "PUBLISHED" ? new Date() : null,
                },
            });
            const valuation = (0, compute_valuation_1.computeValuation)({
                askingPrice: input.askingPrice,
                areaM2: property.areaM2,
                estimatedMonthlyRent: input.estimatedMonthlyRent,
                regionalPriceCeilingPerM2: input.regionalPriceCeilingPerM2,
            });
            await tx.valuationSnapshot.create({
                data: {
                    listingId: listing.id,
                    modelVersion: valuation.modelVersion,
                    estimatedRentMonthly: new client_1.Prisma.Decimal(valuation.estimatedRentMonthly),
                    annualRentEstimate: new client_1.Prisma.Decimal(valuation.annualRentEstimate),
                    capRatePct: new client_1.Prisma.Decimal(valuation.capRatePct),
                    irrEstimatePct: new client_1.Prisma.Decimal(valuation.irrEstimatePct),
                    regionalPriceCeiling: new client_1.Prisma.Decimal(valuation.regionalPriceCeiling),
                    discountVsCeilingPct: new client_1.Prisma.Decimal(valuation.discountVsCeilingPct),
                    confidence: new client_1.Prisma.Decimal(valuation.confidence),
                    inputsJson: valuation.inputs,
                },
            });
            return tx.listing.findUniqueOrThrow({
                where: { id: listing.id },
                include: listingInclude,
            });
        });
    }
    async listByStatus(status) {
        return this.prisma.listing.findMany({
            where: { status },
            orderBy: { publishedAt: "desc" },
            include: listingInclude,
        });
    }
    async findById(id) {
        return this.prisma.listing.findUnique({
            where: { id },
            include: listingInclude,
        });
    }
}
exports.ListingService = ListingService;
