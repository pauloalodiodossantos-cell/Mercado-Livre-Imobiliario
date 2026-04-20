import { Router } from "express";
import { ZodError } from "zod";
import type { ValuationSnapshot } from "@prisma/client";
import type { AuthService } from "../auth/auth-service";
import { requireAuth, requireRole } from "../auth/auth-middleware";
import type { OfferService } from "../offers/offer-service";
import { ListingService } from "./listing-service";

const serializeValuation = (v: ValuationSnapshot) => ({
  modelVersion: v.modelVersion,
  estimatedRentMonthly: v.estimatedRentMonthly?.toString() ?? null,
  annualRentEstimate: v.annualRentEstimate.toString(),
  capRatePct: v.capRatePct.toString(),
  irrEstimatePct: v.irrEstimatePct.toString(),
  regionalPriceCeiling: v.regionalPriceCeiling.toString(),
  discountVsCeilingPct: v.discountVsCeilingPct.toString(),
  confidence: v.confidence.toString(),
});

const serializeListing = (
  listing: Awaited<ReturnType<ListingService["findById"]>>,
) => {
  if (!listing) {
    return null;
  }

  return {
    id: listing.id,
    askingPrice: listing.askingPrice.toString(),
    status: listing.status,
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    property: {
      id: listing.property.id,
      propertyType: listing.property.propertyType,
      addressLine1: listing.property.addressLine1,
      city: listing.property.city,
      state: listing.property.state,
      zipCode: listing.property.zipCode,
      areaM2: listing.property.areaM2,
      bedrooms: listing.property.bedrooms,
      parkingSpots: listing.property.parkingSpots,
    },
    valuation: listing.valuationSnapshot ? serializeValuation(listing.valuationSnapshot) : null,
  };
};

const serializeOffer = (
  offer: Awaited<ReturnType<OfferService["createOffer"]>>,
) => ({
  id: offer.id,
  listingId: offer.listingId,
  buyerUserId: offer.buyerUserId,
  offerPrice: offer.offerPrice.toString(),
  earnestMoney: offer.earnestMoney.toString(),
  status: offer.status,
  createdAt: offer.createdAt.toISOString(),
});

export const buildListingRoutes = (
  authService: AuthService,
  listingService: ListingService,
  offerService: OfferService,
): Router => {
  const router = Router();

  router.get("/", async (req, res) => {
    const status = req.query.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
    const rows = await listingService.listByStatus(status);
    return res.status(200).json({ listings: rows.map((row) => serializeListing(row)) });
  });

  router.post(
    "/",
    requireAuth(authService),
    requireRole("SELLER"),
    async (req, res) => {
      try {
        const sellerUserId = req.user?.id;
        if (!sellerUserId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const listing = await listingService.createForSeller(sellerUserId, req.body);
        return res.status(201).json({ listing: serializeListing(listing) });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: "Invalid payload" });
        }
        return res.status(500).json({ message: "Unexpected error" });
      }
    },
  );

  router.post(
    "/:listingId/offers",
    requireAuth(authService),
    requireRole("BUYER", "BROKER"),
    async (req, res) => {
      try {
        const buyerUserId = req.user?.id;
        if (!buyerUserId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const listingId = String(req.params.listingId);
        const offer = await offerService.createOffer(buyerUserId, listingId, req.body);
        return res.status(201).json({ offer: serializeOffer(offer) });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: "Invalid payload" });
        }
        if (error instanceof Error && error.message === "LISTING_NOT_AVAILABLE") {
          return res.status(404).json({ message: "Listing not available" });
        }
        if (error instanceof Error && error.message === "SELF_OFFER") {
          return res.status(400).json({ message: "Cannot bid on your own listing" });
        }
        if (error instanceof Error && error.message === "OFFER_ALREADY_OPEN") {
          return res.status(409).json({ message: "You already have an open offer on this listing" });
        }
        return res.status(500).json({ message: "Unexpected error" });
      }
    },
  );

  router.get("/:id", async (req, res) => {
    const row = await listingService.findById(String(req.params.id));
    if (!row) {
      return res.status(404).json({ message: "Listing not found" });
    }
    return res.status(200).json({ listing: serializeListing(row) });
  });

  return router;
};
