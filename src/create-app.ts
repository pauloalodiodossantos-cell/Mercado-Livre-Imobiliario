import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { PrismaClient } from "@prisma/client";
import { buildAuthRoutes } from "./auth/auth-routes";
import { AuthService } from "./auth/auth-service";
import { ListingService } from "./listings/listing-service";
import { buildListingRoutes } from "./listings/listing-routes";
import { OfferService } from "./offers/offer-service";
import { buildOfferRoutes } from "./offers/offer-routes";

export const createApp = (prisma: PrismaClient): express.Express => {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: "*" }));
  app.use(express.json());

  const authService = new AuthService(prisma, process.env.JWT_SECRET ?? "dev-secret-change-me");
  const listingService = new ListingService(prisma);
  const offerService = new OfferService(prisma);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/auth", buildAuthRoutes(authService));
  app.use("/listings", buildListingRoutes(authService, listingService, offerService));
  app.use("/offers", buildOfferRoutes(authService, offerService));

  return app;
};
