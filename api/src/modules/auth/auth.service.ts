import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { User as PrismaUser } from "@prisma/client";
import type { LoginInput, RegisterInput, AuthUser } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { signAuthToken } from "../../lib/jwt.js";
import { sendEmail } from "../../lib/email.js";
import { env, primaryOrigin } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../../lib/errors.js";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function registerBusiness(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Business + Owner must be created together — a business with no owner
  // (or vice versa) is an invalid state, so this runs as one transaction.
  const { user, business } = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: { name: input.businessName },
    });

    const user = await tx.user.create({
      data: {
        businessId: business.id,
        name: input.ownerName,
        email: input.email,
        passwordHash,
        role: "OWNER",
      },
    });

    return { user, business };
  });

  const token = signAuthToken({ userId: user.id, businessId: business.id, role: user.role });

  return { token, user: toAuthUser(user), business };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Same generic message whether the email doesn't exist or the password is
  // wrong — avoids leaking which emails have registered accounts.
  if (!user || !user.isActive) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = signAuthToken({ userId: user.id, businessId: user.businessId, role: user.role });
  return { token, user: toAuthUser(user) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { business: true },
  });

  if (!user) {
    throw new UnauthorizedError("Account no longer exists");
  }

  return { user: toAuthUser(user), business: user.business };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Silently succeed if the email doesn't exist or is inactive — same
  // anti-enumeration principle as login's generic error message.
  if (!user || !user.isActive) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
  });

  const resetUrl = `${primaryOrigin}/reset-password?token=${rawToken}`;

  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    // Dev fallback: log the link so the flow is testable before Brevo is wired up.
    logger.warn({ resetUrl }, "Brevo not configured — password reset link (dev only)");
    return;
  }

  await sendEmail({
    to: user.email,
    subject: "Reset your Wealthify password",
    html: `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashResetToken(token);
  const user = await prisma.user.findFirst({ where: { passwordResetTokenHash: tokenHash } });

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw new ValidationError("This reset link is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null },
  });
}

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toAuthUser(user: PrismaUser): AuthUser {
  return {
    id: user.id,
    businessId: user.businessId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
