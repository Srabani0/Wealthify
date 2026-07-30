import bcrypt from "bcryptjs";
import type { CreateUserInput, UpdateUserInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors.js";

const SALT_ROUNDS = 10;

const listSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function listUsers(businessId: string) {
  return prisma.user.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
    select: listSelect,
  });
}

export async function createUser(businessId: string, input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      businessId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: listSelect,
  });
}

export async function updateUser(businessId: string, userId: string, input: UpdateUserInput) {
  const target = await prisma.user.findFirst({ where: { id: userId, businessId } });
  if (!target) throw new NotFoundError("User not found");
  // The owner role is fixed at registration — changing it here could leave a
  // business with no owner or create ambiguity about who holds that role.
  if (target.role === "OWNER") {
    throw new ForbiddenError("The business owner's role cannot be changed here");
  }

  return prisma.user.update({
    where: { id: userId },
    data: input,
    select: listSelect,
  });
}
