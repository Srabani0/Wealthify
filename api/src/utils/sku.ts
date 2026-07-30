import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

// Generates a unique, human-readable SKU: first 3 alphanumeric characters
// of the product name (uppercased) + a random 4-digit suffix, retried on
// collision. Readable on a printed label/receipt, unlike a raw cuid.
//
// Takes the caller's Prisma client explicitly (rather than importing the
// shared singleton) so that when this runs inside a product-creation
// `$transaction`, its uniqueness-check query participates in that same
// transaction instead of opening a separate connection — a separate
// connection's round-trip time still counts against the transaction's
// interactive-transaction timeout (5s default), and under any DB latency
// this was expiring the transaction before the variant insert that follows.
export async function generateUniqueSku(client: PrismaClientOrTx, productName: string): Promise<string> {
  const prefix = (productName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3) || "SKU").toUpperCase().padEnd(3, "X");

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${prefix}-${suffix}`;
    const existing = await client.productVariant.findUnique({ where: { sku: candidate } });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique SKU after multiple attempts");
}
