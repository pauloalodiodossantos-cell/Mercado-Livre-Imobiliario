import { Router } from "express";
import type { AuthService } from "../auth/auth-service";
import { requireAuth, requireRole } from "../auth/auth-middleware";
import { OfferService } from "./offer-service";

const serializePipeline = (offer: Awaited<ReturnType<OfferService["getPipelineForUser"]>>) => ({
  offer: {
    id: offer.id,
    listingId: offer.listingId,
    buyerUserId: offer.buyerUserId,
    offerPrice: offer.offerPrice.toString(),
    earnestMoney: offer.earnestMoney.toString(),
    status: offer.status,
    createdAt: offer.createdAt.toISOString(),
  },
  listing: {
    id: offer.listing.id,
    askingPrice: offer.listing.askingPrice.toString(),
    status: offer.listing.status,
    property: {
      addressLine1: offer.listing.property.addressLine1,
      city: offer.listing.property.city,
      state: offer.listing.property.state,
    },
    valuation: offer.listing.valuationSnapshot
      ? {
          capRatePct: offer.listing.valuationSnapshot.capRatePct.toString(),
          irrEstimatePct: offer.listing.valuationSnapshot.irrEstimatePct.toString(),
          discountVsCeilingPct: offer.listing.valuationSnapshot.discountVsCeilingPct.toString(),
        }
      : null,
  },
  dueDiligence: offer.dueDiligenceCase
    ? {
        status: offer.dueDiligenceCase.status,
        riskScore: offer.dueDiligenceCase.riskScore,
        summary: offer.dueDiligenceCase.summary,
        checks: offer.dueDiligenceCase.checks.map((c) => ({
          checkType: c.checkType,
          status: c.status,
          resultSummary: c.resultSummary,
        })),
      }
    : null,
  contract: offer.contract
    ? {
        status: offer.contract.status,
        bodyMarkdown: offer.contract.bodyMarkdown,
      }
    : null,
  escrow: offer.escrowAccount
    ? {
        status: offer.escrowAccount.status,
        targetAmount: offer.escrowAccount.targetAmount.toString(),
        fundedAmount: offer.escrowAccount.fundedAmount.toString(),
        provider: offer.escrowAccount.provider,
        milestones: offer.escrowAccount.milestones.map((m) => ({
          milestoneType: m.milestoneType,
          status: m.status,
        })),
      }
    : null,
});

export const buildOfferRoutes = (authService: AuthService, offerService: OfferService): Router => {
  const router = Router();

  router.get("/mine", requireAuth(authService), async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rows = await offerService.listMine(userId);
    return res.status(200).json({
      offers: rows.map((o) => ({
        id: o.id,
        listingId: o.listingId,
        offerPrice: o.offerPrice.toString(),
        earnestMoney: o.earnestMoney.toString(),
        status: o.status,
        listing: {
          id: o.listing.id,
          city: o.listing.property.city,
          askingPrice: o.listing.askingPrice.toString(),
        },
      })),
    });
  });

  router.post(
    "/:offerId/reject",
    requireAuth(authService),
    requireRole("SELLER"),
    async (req, res) => {
      try {
        const sellerId = req.user?.id;
        if (!sellerId) return res.status(401).json({ message: "Unauthorized" });

        await offerService.rejectOffer(sellerId, String(req.params.offerId));
        return res.status(200).json({ message: "Offer rejected" });
      } catch (error) {
        if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
          return res.status(404).json({ message: "Offer not found" });
        }
        if (error instanceof Error && error.message === "NOT_YOUR_LISTING") {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (error instanceof Error && error.message === "OFFER_NOT_SUBMITTED") {
          return res.status(400).json({ message: "Offer cannot be rejected" });
        }
        return res.status(500).json({ message: "Unexpected error" });
      }
    },
  );

  router.post(
    "/:offerId/accept",
    requireAuth(authService),
    requireRole("SELLER"),
    async (req, res) => {
      try {
        const sellerId = req.user?.id;
        if (!sellerId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        await offerService.acceptOffer(sellerId, String(req.params.offerId));
        return res.status(200).json({ message: "Offer accepted; pipeline started" });
      } catch (error) {
        if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
          return res.status(404).json({ message: "Offer not found" });
        }
        if (error instanceof Error && error.message === "NOT_YOUR_LISTING") {
          return res.status(403).json({ message: "Forbidden" });
        }
        if (error instanceof Error && error.message === "OFFER_NOT_SUBMITTED") {
          return res.status(400).json({ message: "Offer cannot be accepted" });
        }
        if (error instanceof Error && error.message === "PROFILE_MISSING") {
          return res.status(500).json({ message: "Profile missing" });
        }
        return res.status(500).json({ message: "Unexpected error" });
      }
    },
  );

  router.post("/:offerId/escrow/simulate-funding", requireAuth(authService), async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await offerService.simulateEscrowFunding(String(req.params.offerId), userId);
      return res.status(200).json({ message: "Escrow funded (simulated)" });
    } catch (error) {
      if (error instanceof Error && error.message === "ESCROW_NOT_READY") {
        return res.status(400).json({ message: "Escrow not available for this offer" });
      }
      if (error instanceof Error && error.message === "FORBIDDEN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (error instanceof Error && error.message === "OFFER_NOT_ACCEPTED") {
        return res.status(400).json({ message: "Offer must be accepted first" });
      }
      return res.status(500).json({ message: "Unexpected error" });
    }
  });

  router.get("/:offerId/pipeline", requireAuth(authService), async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const offer = await offerService.getPipelineForUser(String(req.params.offerId), userId);
      return res.status(200).json(serializePipeline(offer));
    } catch (error) {
      if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
        return res.status(404).json({ message: "Offer not found" });
      }
      if (error instanceof Error && error.message === "FORBIDDEN") {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.status(500).json({ message: "Unexpected error" });
    }
  });

  return router;
};
