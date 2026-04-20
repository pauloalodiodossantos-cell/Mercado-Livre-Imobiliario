import type { RequestHandler } from "express";
import type { AuthService } from "./auth-service";
import type { UserRole } from "@prisma/client";

export const requireAuth =
  (authService: AuthService): RequestHandler =>
  async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing bearer token" });
    }

    const token = authorization.replace("Bearer ", "");

    try {
      req.user = await authService.verifyToken(token);
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
