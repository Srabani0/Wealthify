import jwt from "jsonwebtoken";
import type { AuthTokenPayload } from "@wealthify/shared";
import { env } from "../config/env.js";

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}
