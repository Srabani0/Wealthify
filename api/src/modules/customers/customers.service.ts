import type { CreateCustomerInput, UpdateCustomerInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../lib/errors.js";

export async function listCustomers(businessId: string) {
  return prisma.customer.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createCustomer(businessId: string, input: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      businessId,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
    },
  });
}

export async function updateCustomer(businessId: string, id: string, input: UpdateCustomerInput) {
  const customer = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!customer) throw new NotFoundError("Customer not found");

  return prisma.customer.update({ where: { id }, data: input });
}

export async function deleteCustomer(businessId: string, id: string) {
  const customer = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!customer) throw new NotFoundError("Customer not found");

  // Soft delete — existing order history references this customer.
  await prisma.customer.update({ where: { id }, data: { isActive: false } });
}
