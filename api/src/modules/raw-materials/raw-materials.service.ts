import type { CreateRawMaterialInput, UpdateRawMaterialInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";

export async function listRawMaterials(businessId: string) {
  return prisma.rawMaterial.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createRawMaterial(businessId: string, input: CreateRawMaterialInput) {
  const existing = await prisma.rawMaterial.findFirst({ where: { businessId, name: input.name } });
  if (existing) throw new ConflictError("A raw material with this name already exists");

  return prisma.rawMaterial.create({
    data: { businessId, name: input.name, defaultUnit: input.defaultUnit },
  });
}

export async function updateRawMaterial(businessId: string, id: string, input: UpdateRawMaterialInput) {
  const material = await prisma.rawMaterial.findFirst({ where: { id, businessId } });
  if (!material) throw new NotFoundError("Raw material not found");

  if (input.name) {
    const nameTaken = await prisma.rawMaterial.findFirst({
      where: { businessId, name: input.name, NOT: { id } },
    });
    if (nameTaken) throw new ConflictError("A raw material with this name already exists");
  }

  return prisma.rawMaterial.update({ where: { id }, data: input });
}

export async function deleteRawMaterial(businessId: string, id: string) {
  const material = await prisma.rawMaterial.findFirst({ where: { id, businessId } });
  if (!material) throw new NotFoundError("Raw material not found");

  // Soft delete — existing purchase history references this material.
  await prisma.rawMaterial.update({ where: { id }, data: { isActive: false } });
}
