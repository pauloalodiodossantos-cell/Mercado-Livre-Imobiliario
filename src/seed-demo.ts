/**
 * Seed de demonstração — popula dados realistas para apresentar o MVP.
 * Uso: npx tsx src/seed-demo.ts
 * Funciona com qualquer banco (Postgres ou PGlite via server-demo).
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

function token(userId: string, email: string) {
  return jwt.sign({ email }, JWT_SECRET, { subject: userId, expiresIn: "12h" });
}

async function main() {
  console.log("\n🏠  Mercado Livre de Imóveis — Seed de Demo\n");

  // ── Usuários ────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("senha1234", 10);

  const seller = await prisma.user.upsert({
    where: { email: "vendedor@demo.com" },
    update: {},
    create: {
      email: "vendedor@demo.com",
      passwordHash: hash,
      role: "SELLER",
      profile: { create: { fullName: "Ana Souza", cpfCnpj: "111.222.333-01" } },
    },
    include: { profile: true },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "comprador@demo.com" },
    update: {},
    create: {
      email: "comprador@demo.com",
      passwordHash: hash,
      role: "BUYER",
      profile: { create: { fullName: "Bruno Lima", cpfCnpj: "444.555.666-02" } },
    },
    include: { profile: true },
  });

  const broker = await prisma.user.upsert({
    where: { email: "corretor@demo.com" },
    update: {},
    create: {
      email: "corretor@demo.com",
      passwordHash: hash,
      role: "BROKER",
      profile: { create: { fullName: "Carla Mendes", cpfCnpj: "777.888.999-03" } },
    },
    include: { profile: true },
  });

  // ── Imóveis / Anúncios ──────────────────────────────────────────────────────
  const propertiesData = [
    {
      propertyType: "Apartamento",
      addressLine1: "Rua das Flores, 120 — Apto 42",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      areaM2: 78,
      bedrooms: 2,
      parkingSpots: 1,
      askingPrice: 650_000,
      estimatedMonthlyRent: 3_200,
      regionalPriceCeilingPerM2: 9_500,
    },
    {
      propertyType: "Casa",
      addressLine1: "Av. Brasil, 500",
      city: "Campinas",
      state: "SP",
      zipCode: "13010-050",
      areaM2: 150,
      bedrooms: 3,
      parkingSpots: 2,
      askingPrice: 980_000,
      estimatedMonthlyRent: 4_800,
      regionalPriceCeilingPerM2: 7_200,
    },
    {
      propertyType: "Studio",
      addressLine1: "Rua Augusta, 800 — Apto 12",
      city: "São Paulo",
      state: "SP",
      zipCode: "01305-100",
      areaM2: 32,
      bedrooms: 1,
      parkingSpots: 0,
      askingPrice: 320_000,
      estimatedMonthlyRent: 1_800,
      regionalPriceCeilingPerM2: 11_000,
    },
  ];

  const listings: { id: string }[] = [];

  for (const p of propertiesData) {
    const existing = await prisma.listing.findFirst({
      where: { property: { addressLine1: p.addressLine1 } },
    });
    if (existing) {
      listings.push(existing);
      continue;
    }

    const property = await prisma.property.create({
      data: {
        sellerUserId: seller.id,
        propertyType: p.propertyType,
        addressLine1: p.addressLine1,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        areaM2: p.areaM2,
        bedrooms: p.bedrooms,
        parkingSpots: p.parkingSpots,
      },
    });

    const listing = await prisma.listing.create({
      data: {
        propertyId: property.id,
        sellerUserId: seller.id,
        askingPrice: new Prisma.Decimal(p.askingPrice),
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    const annualRent = p.estimatedMonthlyRent * 12;
    const capRate = (annualRent / p.askingPrice) * 100;
    const regionalCeiling = p.regionalPriceCeilingPerM2 * p.areaM2;
    const discount = ((regionalCeiling - p.askingPrice) / regionalCeiling) * 100;

    await prisma.valuationSnapshot.create({
      data: {
        listingId: listing.id,
        modelVersion: "mvp-1",
        estimatedRentMonthly: new Prisma.Decimal(p.estimatedMonthlyRent),
        annualRentEstimate: new Prisma.Decimal(annualRent),
        capRatePct: new Prisma.Decimal(capRate.toFixed(4)),
        irrEstimatePct: new Prisma.Decimal((capRate * 0.92).toFixed(4)),
        regionalPriceCeiling: new Prisma.Decimal(regionalCeiling),
        discountVsCeilingPct: new Prisma.Decimal(discount.toFixed(4)),
        confidence: new Prisma.Decimal("0.75"),
        inputsJson: { askingPrice: p.askingPrice, areaM2: p.areaM2 },
      },
    });

    listings.push(listing);
  }

  // ── Oferta de demo (comprador → primeiro anúncio) ────────────────────────────
  const firstListing = listings[0];
  const existingOffer = await prisma.offer.findFirst({
    where: { listingId: firstListing.id, buyerUserId: buyer.id },
  });

  if (!existingOffer) {
    await prisma.offer.create({
      data: {
        listingId: firstListing.id,
        buyerUserId: buyer.id,
        offerPrice: new Prisma.Decimal(630_000),
        earnestMoney: new Prisma.Decimal(31_500),
        status: "SUBMITTED",
      },
    });
  }

  // ── Saída ──────────────────────────────────────────────────────────────────
  const sellerToken = token(seller.id, seller.email);
  const buyerToken = token(buyer.id, buyer.email);
  const brokerToken = token(broker.id, broker.email);

  console.log("✅  Usuários criados / já existentes:");
  console.log(`   Vendedor  → ${seller.email}  (senha: senha1234)`);
  console.log(`   Comprador → ${buyer.email}  (senha: senha1234)`);
  console.log(`   Corretor  → ${broker.email}  (senha: senha1234)\n`);

  console.log("✅  Anúncios publicados:");
  listings.forEach((l, i) => console.log(`   [${i + 1}] id: ${l.id}`));

  console.log(`\n✅  Oferta submetida no anúncio 1: id do listing → ${firstListing.id}\n`);

  console.log("─────────────────────────────────────────────────────────");
  console.log("Tokens JWT (válidos por 12h) — copie para o Postman/Insomnia:\n");
  console.log(`SELLER_TOKEN=${sellerToken}\n`);
  console.log(`BUYER_TOKEN=${buyerToken}\n`);
  console.log(`BROKER_TOKEN=${brokerToken}\n`);
  console.log("─────────────────────────────────────────────────────────");
  console.log("\n🚀  Fluxo sugerido para demo:");
  console.log("  1. GET  /listings                          → vitrine pública");
  console.log(`  2. GET  /listings/${firstListing.id}   → detalhe com valuation`);
  console.log(`  3. GET  /listings/${firstListing.id}/offers  (SELLER) → ver proposta`);
  console.log(`  4. POST /offers/<offerId>/accept  (SELLER) → aceita + cria DD/contrato/escrow`);
  console.log(`  5. GET  /offers/<offerId>/pipeline (BUYER)  → estado completo`);
  console.log(`  6. POST /offers/<offerId>/escrow/simulate-funding → simula pagamento\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
