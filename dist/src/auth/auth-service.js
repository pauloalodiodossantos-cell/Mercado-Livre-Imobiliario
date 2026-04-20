"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    fullName: zod_1.z.string().min(3),
    cpfCnpj: zod_1.z.string().min(11),
    role: zod_1.z.enum(["BUYER", "SELLER", "BROKER", "ADMIN"]),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
class AuthService {
    prisma;
    jwtSecret;
    constructor(prisma, jwtSecret) {
        this.prisma = prisma;
        this.jwtSecret = jwtSecret;
    }
    async register(payload) {
        const input = registerSchema.parse(payload);
        const emailTaken = await this.prisma.user.findUnique({
            where: { email: input.email.toLowerCase() },
        });
        if (emailTaken) {
            throw new Error("EMAIL_EXISTS");
        }
        const cpfTaken = await this.prisma.profile.findUnique({
            where: { cpfCnpj: input.cpfCnpj },
        });
        if (cpfTaken) {
            throw new Error("CPF_EXISTS");
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: input.email.toLowerCase(),
                    passwordHash,
                    role: input.role,
                    profile: {
                        create: {
                            fullName: input.fullName,
                            cpfCnpj: input.cpfCnpj,
                        },
                    },
                },
                include: { profile: true },
            });
            if (!user.profile) {
                throw new Error("PROFILE_MISSING");
            }
            const publicUser = this.toPublicUser(user, user.profile);
            return {
                user: publicUser,
                token: this.signToken(publicUser),
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                const meta = error.meta;
                const raw = meta?.target;
                const targets = Array.isArray(raw) ? raw : raw ? [raw] : [];
                const blob = `${JSON.stringify(meta)} ${targets.join(" ")} ${error.message}`.toLowerCase();
                if (blob.includes("email")) {
                    throw new Error("EMAIL_EXISTS");
                }
                if (blob.includes("cpfcnpj") || blob.includes("cpf")) {
                    throw new Error("CPF_EXISTS");
                }
                throw new Error("DUPLICATE_ENTRY");
            }
            throw error;
        }
    }
    async login(payload) {
        const input = loginSchema.parse(payload);
        const user = await this.prisma.user.findUnique({
            where: { email: input.email.toLowerCase() },
            include: { profile: true },
        });
        if (!user?.profile) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const validPassword = await bcryptjs_1.default.compare(input.password, user.passwordHash);
        if (!validPassword) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const publicUser = this.toPublicUser(user, user.profile);
        return {
            user: publicUser,
            token: this.signToken(publicUser),
        };
    }
    async verifyToken(token) {
        const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
        const user = await this.prisma.user.findUnique({
            where: { id: decoded.sub },
            include: { profile: true },
        });
        if (!user?.profile) {
            throw new Error("INVALID_TOKEN");
        }
        return this.toPublicUser(user, user.profile);
    }
    signToken(user) {
        return jsonwebtoken_1.default.sign({ email: user.email }, this.jwtSecret, {
            subject: user.id,
            expiresIn: "12h",
        });
    }
    toPublicUser(user, profile) {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: profile.fullName,
            cpfCnpj: profile.cpfCnpj,
        };
    }
}
exports.AuthService = AuthService;
