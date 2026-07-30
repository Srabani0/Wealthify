import type { UpdateBusinessInput, UpdateBusinessLogoInput } from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { cloudinary } from "../../config/cloudinary.js";

export async function getBusiness(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new NotFoundError("Business not found");
  return business;
}

export async function updateBusiness(businessId: string, input: UpdateBusinessInput) {
  return prisma.business.update({ where: { id: businessId }, data: input });
}

export async function updateBusinessLogo(businessId: string, input: UpdateBusinessLogoInput) {
  const existing = await prisma.business.findUnique({ where: { id: businessId } });
  if (!existing) throw new NotFoundError("Business not found");

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { logoUrl: input.logoUrl, logoPublicId: input.logoPublicId },
  });

  // Best-effort cleanup of the previous logo, done after the DB write
  // succeeds so a Cloudinary hiccup never blocks the update itself.
  if (existing.logoPublicId && existing.logoPublicId !== input.logoPublicId) {
    await cloudinary.uploader.destroy(existing.logoPublicId).catch(() => undefined);
  }

  return updated;
}
