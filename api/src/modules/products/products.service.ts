import { Prisma } from "@prisma/client";
import type {
  AddProductImageInput,
  AddProductVariantInput,
  CreateProductInput,
  ProductListQueryInput,
  ProductVariantInput,
  UpdateProductInput,
  UpdateProductVariantInput,
} from "@wealthify/shared";
import { prisma } from "../../config/prisma.js";
import { cloudinary } from "../../config/cloudinary.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { generateUniqueSku } from "../../utils/sku.js";
import { generateBarcodePng, generateQrCodePng } from "../../lib/barcode/index.js";

const productInclude = {
  category: true,
  brand: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: {
    where: { isActive: true },
    orderBy: { createdAt: "asc" as const },
    include: { inventory: true },
  },
} satisfies Prisma.ProductInclude;

function computeMarginPercent(costPrice: number, sellingPrice: number): number | null {
  if (sellingPrice <= 0) return null;
  return Math.round(((sellingPrice - costPrice) / sellingPrice) * 100 * 100) / 100;
}

async function createVariantForProduct(
  tx: Prisma.TransactionClient,
  productId: string,
  productNameForSku: string,
  input: ProductVariantInput,
) {
  const sku = input.sku?.trim() || (await generateUniqueSku(tx, productNameForSku));
  const marginPercent = computeMarginPercent(input.costPrice, input.sellingPrice);

  const variant = await tx.productVariant.create({
    data: {
      productId,
      sku,
      barcode: input.barcode || null,
      variantName: input.variantName,
      attributes: input.attributes ?? undefined,
      costPrice: input.costPrice,
      sellingPrice: input.sellingPrice,
      mrp: input.mrp ?? null,
      marginPercent,
      lowStockThreshold: input.lowStockThreshold,
    },
  });

  await tx.inventoryStock.create({ data: { variantId: variant.id, quantityOnHand: 0 } });

  return variant;
}

function findProductWithRelations(client: Prisma.TransactionClient, productId: string) {
  return client.product.findUnique({ where: { id: productId }, include: productInclude });
}

export async function listProducts(businessId: string, query: ProductListQueryInput) {
  const where: Prisma.ProductWhereInput = {
    businessId,
    isActive: true,
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.brandId ? { brandId: query.brandId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total };
}

export async function getProduct(businessId: string, productId: string) {
  const product = await findProductWithRelations(prisma, productId);
  if (!product || product.businessId !== businessId) {
    throw new NotFoundError("Product not found");
  }
  return product;
}

export async function createProduct(businessId: string, input: CreateProductInput) {
  return prisma.$transaction(
    async (tx) => {
      let gstRate = input.gstRate;
      if (gstRate === undefined) {
        const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
        gstRate = Number(business.defaultGstRate);
      }

      const product = await tx.product.create({
        data: {
          businessId,
          name: input.name,
          description: input.description ?? null,
          categoryId: input.categoryId ?? null,
          brandId: input.brandId ?? null,
          hsnCode: input.hsnCode ?? null,
          gstRate,
          unit: input.unit,
          hasVariants: input.hasVariants,
        },
      });

      for (const variantInput of input.variants) {
        await createVariantForProduct(tx, product.id, input.name, variantInput);
      }

      return findProductWithRelations(tx, product.id);
    },
    // Default 5s is too tight for this many sequential round-trips (one
    // per variant, each doing a SKU-uniqueness check) under real Neon
    // latency/cold-start variance — was expiring the transaction mid-way.
    { timeout: 15000 },
  );
}

export async function updateProduct(businessId: string, productId: string, input: UpdateProductInput) {
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new NotFoundError("Product not found");

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      brandId: input.brandId,
      hsnCode: input.hsnCode,
      gstRate: input.gstRate,
      unit: input.unit,
      hasVariants: input.hasVariants,
      isActive: input.isActive,
    },
  });

  return findProductWithRelations(prisma, productId);
}

export async function deleteProduct(businessId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new NotFoundError("Product not found");

  // Soft delete — the product may be referenced by historical stock
  // movements/orders/invoices once later phases land, so it can't be
  // removed outright.
  await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
}

export async function addProductVariant(
  businessId: string,
  productId: string,
  input: AddProductVariantInput,
) {
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new NotFoundError("Product not found");

  return prisma.$transaction((tx) => createVariantForProduct(tx, productId, product.name, input), {
    timeout: 15000,
  });
}

export async function updateProductVariant(
  businessId: string,
  variantId: string,
  input: UpdateProductVariantInput,
) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { businessId } },
  });
  if (!variant) throw new NotFoundError("Variant not found");

  const costPrice = input.costPrice ?? Number(variant.costPrice);
  const sellingPrice = input.sellingPrice ?? Number(variant.sellingPrice);
  const marginPercent = computeMarginPercent(costPrice, sellingPrice);

  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      variantName: input.variantName,
      // Prisma's Json field needs the `Prisma.JsonNull` sentinel to clear
      // a value — a plain `null` literal isn't assignable to a Json column.
      attributes: input.attributes === null ? Prisma.JsonNull : input.attributes,
      sku: input.sku,
      barcode: input.barcode,
      costPrice: input.costPrice,
      sellingPrice: input.sellingPrice,
      mrp: input.mrp,
      marginPercent,
      lowStockThreshold: input.lowStockThreshold,
      isActive: input.isActive,
    },
  });
}

export async function deleteProductVariant(businessId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { businessId } },
  });
  if (!variant) throw new NotFoundError("Variant not found");

  const activeCount = await prisma.productVariant.count({
    where: { productId: variant.productId, isActive: true },
  });
  if (activeCount <= 1) {
    throw new ValidationError("A product must have at least one active variant");
  }

  await prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
}

export async function addProductImage(
  businessId: string,
  productId: string,
  input: AddProductImageInput,
) {
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new NotFoundError("Product not found");

  const maxSortOrder = await prisma.productImage.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });

  return prisma.productImage.create({
    data: {
      productId,
      url: input.url,
      publicId: input.publicId,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function deleteProductImage(businessId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, product: { businessId } },
  });
  if (!image) throw new NotFoundError("Image not found");

  await prisma.productImage.delete({ where: { id: imageId } });
  // Best-effort cleanup, after the DB write succeeds so a Cloudinary
  // hiccup never blocks the delete itself (same pattern as the logo).
  await cloudinary.uploader.destroy(image.publicId).catch(() => undefined);
}

async function getVariantOrThrow(businessId: string, variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { businessId } },
  });
  if (!variant) throw new NotFoundError("Variant not found");
  return variant;
}

export async function getVariantBarcodePng(businessId: string, variantId: string): Promise<Buffer> {
  const variant = await getVariantOrThrow(businessId, variantId);
  return generateBarcodePng(variant.barcode || variant.sku);
}

export async function getVariantQrCodePng(businessId: string, variantId: string): Promise<Buffer> {
  const variant = await getVariantOrThrow(businessId, variantId);
  return generateQrCodePng(variant.sku);
}
