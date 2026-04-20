import type { PublicUser } from "../auth/auth-service";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
