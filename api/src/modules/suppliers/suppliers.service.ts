import type { CreateSupplierInput, UpdateSupplierInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";

export async function listSuppliers(businessId: string) {
  return prisma.supplier.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createSupplier(businessId: string, input: CreateSupplierInput) {
  const existing = await prisma.supplier.findFirst({ where: { businessId, name: input.name } });
  if (existing) throw new ConflictError("A supplier with this name already exists");

  return prisma.supplier.create({
    data: {
      businessId,
      name: input.name,
      contactPerson: input.contactPerson ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
    },
  });
}

export async function updateSupplier(businessId: string, id: string, input: UpdateSupplierInput) {
  const supplier = await prisma.supplier.findFirst({ where: { id, businessId } });
  if (!supplier) throw new NotFoundError("Supplier not found");

  if (input.name) {
    const nameTaken = await prisma.supplier.findFirst({
      where: { businessId, name: input.name, NOT: { id } },
    });
    if (nameTaken) throw new ConflictError("A supplier with this name already exists");
  }

  return prisma.supplier.update({ where: { id }, data: input });
}

export async function deleteSupplier(businessId: string, id: string) {
  const supplier = await prisma.supplier.findFirst({ where: { id, businessId } });
  if (!supplier) throw new NotFoundError("Supplier not found");

  // Soft delete — existing purchase history references this supplier.
  await prisma.supplier.update({ where: { id }, data: { isActive: false } });
}
