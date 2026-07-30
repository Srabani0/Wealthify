import type { AuthTokenPayload } from "@wealthify/shared";

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};
