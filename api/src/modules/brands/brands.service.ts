import type { CreateBrandInput, UpdateBrandInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";

export async function listBrands(businessId: string) {
  return prisma.brand.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
  });
}

export async function createBrand(businessId: string, input: CreateBrandInput) {
  const existing = await prisma.brand.findFirst({ where: { businessId, name: input.name } });
  if (existing) throw new ConflictError("A brand with this name already exists");

  return prisma.brand.create({ data: { businessId, name: input.name } });
}

export async function updateBrand(businessId: string, brandId: string, input: UpdateBrandInput) {
  const brand = await prisma.brand.findFirst({ where: { id: brandId, businessId } });
  if (!brand) throw new NotFoundError("Brand not found");

  if (input.name) {
    const nameTaken = await prisma.brand.findFirst({
      where: { businessId, name: input.name, NOT: { id: brandId } },
    });
    if (nameTaken) throw new ConflictError("A brand with this name already exists");
  }

  return prisma.brand.update({ where: { id: brandId }, data: input });
}

export async function deleteBrand(businessId: string, brandId: string) {
  const brand = await prisma.brand.findFirst({ where: { id: brandId, businessId } });
  if (!brand) throw new NotFoundError("Brand not found");

  // Products referencing this brand fall back to no-brand (onDelete: SetNull).
  await prisma.brand.delete({ where: { id: brandId } });
}
