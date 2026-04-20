"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("./auth/auth-routes");
const auth_service_1 = require("./auth/auth-service");
const listing_service_1 = require("./listings/listing-service");
const listing_routes_1 = require("./listings/listing-routes");
const offer_service_1 = require("./offers/offer-service");
const offer_routes_1 = require("./offers/offer-routes");
const createApp = (prisma) => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const authService = new auth_service_1.AuthService(prisma, process.env.JWT_SECRET ?? "dev-secret-change-me");
    const listingService = new listing_service_1.ListingService(prisma);
    const offerService = new offer_service_1.OfferService(prisma);
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
    app.use("/auth", (0, auth_routes_1.buildAuthRoutes)(authService));
    app.use("/listings", (0, listing_routes_1.buildListingRoutes)(authService, listingService, offerService));
    app.use("/offers", (0, offer_routes_1.buildOfferRoutes)(authService, offerService));
    return app;
};
exports.createApp = createApp;
