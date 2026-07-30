import type { CreateCategoryInput, UpdateCategoryInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors.js";

export async function listCategories(businessId: string) {
  return prisma.category.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(businessId: string, input: CreateCategoryInput) {
  if (input.parentId) {
    await assertParentBelongsToBusiness(businessId, input.parentId);
  }

  const existing = await prisma.category.findFirst({ where: { businessId, name: input.name } });
  if (existing) throw new ConflictError("A category with this name already exists");

  return prisma.category.create({
    data: { businessId, name: input.name, parentId: input.parentId ?? null },
  });
}

export async function updateCategory(businessId: string, categoryId: string, input: UpdateCategoryInput) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, businessId } });
  if (!category) throw new NotFoundError("Category not found");

  if (input.parentId) {
    if (input.parentId === categoryId) {
      throw new ValidationError("A category cannot be its own parent");
    }
    await assertParentBelongsToBusiness(businessId, input.parentId);
  }

  if (input.name) {
    const nameTaken = await prisma.category.findFirst({
      where: { businessId, name: input.name, NOT: { id: categoryId } },
    });
    if (nameTaken) throw new ConflictError("A category with this name already exists");
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: { name: input.name, parentId: input.parentId },
  });
}

export async function deleteCategory(businessId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, businessId } });
  if (!category) throw new NotFoundError("Category not found");

  // Products referencing this category fall back to uncategorized
  // (Product.categoryId is onDelete: SetNull) rather than blocking deletion.
  await prisma.category.delete({ where: { id: categoryId } });
}

async function assertParentBelongsToBusiness(businessId: string, parentId: string) {
  const parent = await prisma.category.findFirst({ where: { id: parentId, businessId } });
  if (!parent) throw new ValidationError("Parent category not found");
}
