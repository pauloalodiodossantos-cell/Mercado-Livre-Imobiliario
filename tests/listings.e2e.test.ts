import request from "supertest";
import { getTestContext, resetTestDatabase, teardownTestContext } from "./test-context";

describe("Listings API", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await teardownTestContext();
  });

  it("rejects create listing without auth", async () => {
    const { app } = await getTestContext();
    const response = await request(app).post("/listings").send({
      propertyType: "apartment",
      addressLine1: "Rua A 1",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01000000",
      askingPrice: 450000,
    });

    expect(response.status).toBe(401);
  });

  it("rejects create listing for non-seller role", async () => {
    const { app } = await getTestContext();
    const registerResponse = await request(app).post("/auth/register").send({
      email: "buyer@test.com",
      password: "StrongPass123",
      fullName: "Buyer One",
      cpfCnpj: "12345678900",
      role: "BUYER",
    });

    const response = await request(app)
      .post("/listings")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({
        propertyType: "apartment",
        addressLine1: "Rua A 1",
        city: "Sao Paulo",
        state: "SP",
        zipCode: "01000000",
        askingPrice: 450000,
      });

    expect(response.status).toBe(403);
  });

  it("creates listing for seller and lists published feed", async () => {
    const { app } = await getTestContext();
    const registerResponse = await request(app).post("/auth/register").send({
      email: "seller@test.com",
      password: "StrongPass123",
      fullName: "Seller One",
      cpfCnpj: "12345678901",
      role: "SELLER",
    });

    const createResponse = await request(app)
      .post("/listings")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({
        propertyType: "apartment",
        addressLine1: "Rua B 10",
        city: "Sao Paulo",
        state: "SP",
        zipCode: "02000000",
        areaM2: 72,
        bedrooms: 2,
        parkingSpots: 1,
        askingPrice: 520000,
        status: "PUBLISHED",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.listing.status).toBe("PUBLISHED");
    expect(createResponse.body.listing.askingPrice).toBe("520000");
    expect(createResponse.body.listing.valuation).not.toBeNull();
    expect(createResponse.body.listing.valuation.capRatePct).toBeDefined();

    const listResponse = await request(app).get("/listings?status=PUBLISHED");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.listings).toHaveLength(1);
    expect(listResponse.body.listings[0].property.city).toBe("Sao Paulo");
  });

  it("returns listing by id", async () => {
    const { app } = await getTestContext();
    const registerResponse = await request(app).post("/auth/register").send({
      email: "seller2@test.com",
      password: "StrongPass123",
      fullName: "Seller Two",
      cpfCnpj: "12345678902",
      role: "SELLER",
    });

    const createResponse = await request(app)
      .post("/listings")
      .set("Authorization", `Bearer ${registerResponse.body.token}`)
      .send({
        propertyType: "house",
        addressLine1: "Rua C 20",
        city: "Campinas",
        state: "SP",
        zipCode: "13000000",
        askingPrice: 890000,
      });

    const id = createResponse.body.listing.id as string;
    const response = await request(app).get(`/listings/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.listing.id).toBe(id);
    expect(response.body.listing.property.city).toBe("Campinas");
  });
});
