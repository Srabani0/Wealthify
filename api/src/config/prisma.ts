import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// Single shared instance — Prisma manages its own connection pool internally,
// so a fresh PrismaClient per request would exhaust Neon's connection limit.
export const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
