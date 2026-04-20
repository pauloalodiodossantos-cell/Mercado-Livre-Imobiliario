"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const buildAuthRoutes = (authService) => {
    const router = (0, express_1.Router)();
    router.post("/register", async (req, res) => {
        try {
            const result = await authService.register(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({ message: "Invalid payload" });
            }
            if (error instanceof Error && error.message === "EMAIL_EXISTS") {
                return res.status(409).json({ message: "Email already registered" });
            }
            if (error instanceof Error && error.message === "CPF_EXISTS") {
                return res.status(409).json({ message: "CPF/CNPJ already registered" });
            }
            return res.status(500).json({ message: "Unexpected error" });
        }
    });
    router.post("/login", async (req, res) => {
        try {
            const result = await authService.login(req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({ message: "Invalid payload" });
            }
            if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            return res.status(500).json({ message: "Unexpected error" });
        }
    });
    router.get("/me", async (req, res) => {
        const authorization = req.headers.authorization;
        if (!authorization?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing bearer token" });
        }
        const token = authorization.replace("Bearer ", "");
        try {
            const user = await authService.verifyToken(token);
            return res.status(200).json({ user });
        }
        catch {
            return res.status(401).json({ message: "Invalid token" });
        }
    });
    return router;
};
exports.buildAuthRoutes = buildAuthRoutes;
