import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { PrismaClient, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(3),
  cpfCnpj: z.string().min(11),
  role: z.enum(["BUYER", "SELLER", "BROKER", "ADMIN"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  cpfCnpj: string;
};

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtSecret: string,
  ) {}

  async register(payload: unknown): Promise<{ user: PublicUser; token: string }> {
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

    const passwordHash = await bcrypt.hash(input.password, 10);

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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const meta = error.meta as { target?: string | string[] } | undefined;
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

  async login(payload: unknown): Promise<{ user: PublicUser; token: string }> {
    const input = loginSchema.parse(payload);
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user?.profile) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const publicUser = this.toPublicUser(user, user.profile);
    return {
      user: publicUser,
      token: this.signToken(publicUser),
    };
  }

  async verifyToken(token: string): Promise<PublicUser> {
    const decoded = jwt.verify(token, this.jwtSecret) as { sub: string };
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { profile: true },
    });

    if (!user?.profile) {
      throw new Error("INVALID_TOKEN");
    }

    return this.toPublicUser(user, user.profile);
  }

  private signToken(user: PublicUser): string {
    return jwt.sign({ email: user.email }, this.jwtSecret, {
      subject: user.id,
      expiresIn: "12h",
    });
  }

  private toPublicUser(
    user: { id: string; email: string; role: UserRole },
    profile: { fullName: string; cpfCnpj: string },
  ): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: profile.fullName,
      cpfCnpj: profile.cpfCnpj,
    };
  }
}
