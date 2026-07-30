import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  // Optional: without these, password-reset emails log to the console
  // instead of sending — lets the app run before Brevo is configured.
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().optional(),
  BREVO_SENDER_NAME: z.string().default("Wealthify"),
  // Optional: without this, the Copilot chat feature responds with a clear
  // provider error instead of a real answer — the rest of the app works fine.
  GEMINI_API_KEY: z.string().optional(),
  // A rolling alias (tracks whichever flash-tier model is currently GA)
  // rather than a pinned version, since Gemini model aliases get retired
  // often — override here if a specific pinned version is ever needed.
  GEMINI_MODEL: z.string().default("gemini-flash-latest"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — check apps/api/.env against .env.example");
}

export const env = parsed.data;
