import { z } from "zod";

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).optional(),
  legalName: z.string().trim().max(200).optional().nullable(),
  gstNumber: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(10).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().toLowerCase().email().optional().nullable(),
  currency: z.string().trim().optional(),
  // coerce so an HTML number input's string value validates directly with
  // the same schema the backend uses
  defaultGstRate: z.coerce.number().min(0).max(100).optional(),
  invoicePrefix: z.string().trim().min(1).max(10).optional(),
  quotationPrefix: z.string().trim().min(1).max(10).optional(),
});
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

export const updateBusinessLogoSchema = z.object({
  logoUrl: z.string().url(),
  logoPublicId: z.string().min(1),
});
export type UpdateBusinessLogoInput = z.infer<typeof updateBusinessLogoSchema>;
