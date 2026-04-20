import request from "supertest";
import { getTestContext, resetTestDatabase, teardownTestContext } from "./test-context";

describe("Auth API", () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await teardownTestContext();
  });

  it("returns API status on health endpoint", async () => {
    const { app } = await getTestContext();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("registers a user with valid payload", async () => {
    const { app } = await getTestContext();
    const response = await request(app).post("/auth/register").send({
      email: "buyer@test.com",
      password: "StrongPass123",
      fullName: "Buyer One",
      cpfCnpj: "12345678900",
      role: "BUYER",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("buyer@test.com");
    expect(response.body.token).toBeDefined();
  });

  it("prevents duplicate email registration", async () => {
    const { app } = await getTestContext();
    await request(app).post("/auth/register").send({
      email: "duplicate@test.com",
      password: "StrongPass123",
      fullName: "Dup User",
      cpfCnpj: "12345678901",
      role: "BUYER",
    });

    const response = await request(app).post("/auth/register").send({
      email: "duplicate@test.com",
      password: "StrongPass123",
      fullName: "Dup User 2",
      cpfCnpj: "12345678902",
      role: "BUYER",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already registered");
  });

  it("authenticates with valid credentials", async () => {
    const { app } = await getTestContext();
    await request(app).post("/auth/register").send({
      email: "login@test.com",
      password: "StrongPass123",
      fullName: "Login User",
      cpfCnpj: "12345678903",
      role: "BUYER",
    });

    const response = await request(app).post("/auth/login").send({
      email: "login@test.com",
      password: "StrongPass123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it("returns authenticated user from bearer token", async () => {
    const { app } = await getTestContext();
    const registerResponse = await request(app).post("/auth/register").send({
      email: "me@test.com",
      password: "StrongPass123",
      fullName: "Profile User",
      cpfCnpj: "12345678904",
      role: "BUYER",
    });

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${registerResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("me@test.com");
  });
});
