import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { computeValuation } from "../valuation/compute-valuation";

const createListingSchema = z.object({
  propertyType: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(1),
  areaM2: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  parkingSpots: z.number().int().nonnegative().optional(),
  askingPrice: z.number().positive(),
  estimatedMonthlyRent: z.number().positive().optional(),
  regionalPriceCeilingPerM2: z.number().positive().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("PUBLISHED"),
});

const listingInclude = {
  property: true,
  valuationSnapshot: true,
} as const;

export class ListingService {
  constructor(private readonly prisma: PrismaClient) {}

  async createForSeller(sellerUserId: string, payload: unknown) {
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
          askingPrice: new Prisma.Decimal(input.askingPrice),
          status: input.status,
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        },
      });

      const valuation = computeValuation({
        askingPrice: input.askingPrice,
        areaM2: property.areaM2,
        estimatedMonthlyRent: input.estimatedMonthlyRent,
        regionalPriceCeilingPerM2: input.regionalPriceCeilingPerM2,
      });

      await tx.valuationSnapshot.create({
        data: {
          listingId: listing.id,
          modelVersion: valuation.modelVersion,
          estimatedRentMonthly: new Prisma.Decimal(valuation.estimatedRentMonthly),
          annualRentEstimate: new Prisma.Decimal(valuation.annualRentEstimate),
          capRatePct: new Prisma.Decimal(valuation.capRatePct),
          irrEstimatePct: new Prisma.Decimal(valuation.irrEstimatePct),
          regionalPriceCeiling: new Prisma.Decimal(valuation.regionalPriceCeiling),
          discountVsCeilingPct: new Prisma.Decimal(valuation.discountVsCeilingPct),
          confidence: new Prisma.Decimal(valuation.confidence),
          inputsJson: valuation.inputs as Prisma.InputJsonValue,
        },
      });

      return tx.listing.findUniqueOrThrow({
        where: { id: listing.id },
        include: listingInclude,
      });
    });
  }

  async listByStatus(status: "PUBLISHED" | "DRAFT") {
    return this.prisma.listing.findMany({
      where: { status },
      orderBy: { publishedAt: "desc" },
      include: listingInclude,
    });
  }

  async findById(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude,
    });
  }
}
