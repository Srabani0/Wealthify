// Wire shape returned by the business/auth endpoints. Prisma's Decimal and
// DateTime fields serialize to JSON as strings, hence defaultGstRate/dates
// being `string` here rather than `number`/`Date`.
export interface BusinessProfile {
  id: string;
  name: string;
  legalName: string | null;
  gstNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  currency: string;
  defaultGstRate: string;
  invoicePrefix: string;
  quotationPrefix: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
  createdAt: string;
}
