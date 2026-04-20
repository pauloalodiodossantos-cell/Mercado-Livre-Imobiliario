"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const test_context_1 = require("./test-context");
describe("MVP flow (listing -> offer -> accept -> pipeline)", () => {
    beforeEach(async () => {
        await (0, test_context_1.resetTestDatabase)();
    });
    afterAll(async () => {
        await (0, test_context_1.teardownTestContext)();
    });
    it("runs end-to-end stub pipeline", async () => {
        const { app } = await (0, test_context_1.getTestContext)();
        const sellerReg = await (0, supertest_1.default)(app).post("/auth/register").send({
            email: "seller-mvp@test.com",
            password: "StrongPass123",
            fullName: "Seller MVP",
            cpfCnpj: "11111111111",
            role: "SELLER",
        });
        const buyerReg = await (0, supertest_1.default)(app).post("/auth/register").send({
            email: "buyer-mvp@test.com",
            password: "StrongPass123",
            fullName: "Buyer MVP",
            cpfCnpj: "22222222222",
            role: "BUYER",
        });
        const listingRes = await (0, supertest_1.default)(app)
            .post("/listings")
            .set("Authorization", `Bearer ${sellerReg.body.token}`)
            .send({
            propertyType: "apartment",
            addressLine1: "Av Paulista 1000",
            city: "Sao Paulo",
            state: "SP",
            zipCode: "01310100",
            areaM2: 90,
            askingPrice: 900000,
            estimatedMonthlyRent: 4500,
            status: "PUBLISHED",
        });
        expect(listingRes.status).toBe(201);
        const listingId = listingRes.body.listing.id;
        const offerRes = await (0, supertest_1.default)(app)
            .post(`/listings/${listingId}/offers`)
            .set("Authorization", `Bearer ${buyerReg.body.token}`)
            .send({ offerPrice: 880000 });
        expect(offerRes.status).toBe(201);
        const offerId = offerRes.body.offer.id;
        const acceptRes = await (0, supertest_1.default)(app)
            .post(`/offers/${offerId}/accept`)
            .set("Authorization", `Bearer ${sellerReg.body.token}`);
        expect(acceptRes.status).toBe(200);
        const pipelineBuyer = await (0, supertest_1.default)(app)
            .get(`/offers/${offerId}/pipeline`)
            .set("Authorization", `Bearer ${buyerReg.body.token}`);
        expect(pipelineBuyer.status).toBe(200);
        expect(pipelineBuyer.body.offer.status).toBe("ACCEPTED");
        expect(pipelineBuyer.body.dueDiligence).not.toBeNull();
        expect(pipelineBuyer.body.dueDiligence.checks.length).toBe(3);
        expect(pipelineBuyer.body.contract).not.toBeNull();
        expect(pipelineBuyer.body.contract.bodyMarkdown).toContain("Compromisso");
        expect(pipelineBuyer.body.escrow).not.toBeNull();
        expect(pipelineBuyer.body.escrow.milestones.length).toBe(3);
        const listingAfter = await (0, supertest_1.default)(app).get(`/listings/${listingId}`);
        expect(listingAfter.body.listing.status).toBe("UNDER_OFFER");
        const fundRes = await (0, supertest_1.default)(app)
            .post(`/offers/${offerId}/escrow/simulate-funding`)
            .set("Authorization", `Bearer ${buyerReg.body.token}`);
        expect(fundRes.status).toBe(200);
        const pipelineFunded = await (0, supertest_1.default)(app)
            .get(`/offers/${offerId}/pipeline`)
            .set("Authorization", `Bearer ${buyerReg.body.token}`);
        expect(pipelineFunded.body.escrow.status).toBe("FUNDED");
        expect(pipelineFunded.body.escrow.fundedAmount).toBe(pipelineFunded.body.escrow.targetAmount);
    });
});
