import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "@wealthify/shared";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../lib/errors.js";

// Trusts the JWT payload as-is (userId/businessId/role) with no DB roundtrip —
// role changes are rare for a handful of known users, so this stays on the
// hot path without a lookup. A revoked/deactivated user is only caught the
// next time they'd need a fresh token (see JWT_EXPIRES_IN, ~7d).
export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError());
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired session"));
  }
}
