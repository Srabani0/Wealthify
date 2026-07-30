import type { Request, Response } from "express";
import type {
  AddProductImageInput,
  AddProductVariantInput,
  CreateProductInput,
  ProductListQueryInput,
  UpdateProductInput,
  UpdateProductVariantInput,
} from "@wealthify/shared";
import * as productsService from "./products.service.js";
import { sendList, sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listProducts(req: Request, res: Response) {
  const query = req.query as unknown as ProductListQueryInput;
  const { items, total } = await productsService.listProducts(requireBusinessId(req), query);
  sendList(res, items, { page: query.page, pageSize: query.pageSize, total });
}

export async function getProduct(req: Request, res: Response) {
  const product = await productsService.getProduct(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, product);
}

export async function createProduct(req: Request, res: Response) {
  const input = req.body as CreateProductInput;
  const product = await productsService.createProduct(requireBusinessId(req), input);
  sendSuccess(res, product, 201, "Product created");
}

export async function updateProduct(req: Request, res: Response) {
  const input = req.body as UpdateProductInput;
  const product = await productsService.updateProduct(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, product, 200, "Product updated");
}

export async function deleteProduct(req: Request, res: Response) {
  await productsService.deleteProduct(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Product deleted");
}

export async function addProductVariant(req: Request, res: Response) {
  const input = req.body as AddProductVariantInput;
  const variant = await productsService.addProductVariant(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, variant, 201, "Variant added");
}

export async function updateProductVariant(req: Request, res: Response) {
  const input = req.body as UpdateProductVariantInput;
  const variant = await productsService.updateProductVariant(
    requireBusinessId(req),
    req.params.variantId as string,
    input,
  );
  sendSuccess(res, variant, 200, "Variant updated");
}

export async function deleteProductVariant(req: Request, res: Response) {
  await productsService.deleteProductVariant(requireBusinessId(req), req.params.variantId as string);
  sendSuccess(res, null, 200, "Variant deleted");
}

export async function addProductImage(req: Request, res: Response) {
  const input = req.body as AddProductImageInput;
  const image = await productsService.addProductImage(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, image, 201, "Image added");
}

export async function deleteProductImage(req: Request, res: Response) {
  await productsService.deleteProductImage(requireBusinessId(req), req.params.imageId as string);
  sendSuccess(res, null, 200, "Image deleted");
}

export async function getVariantBarcode(req: Request, res: Response) {
  const png = await productsService.getVariantBarcodePng(
    requireBusinessId(req),
    req.params.variantId as string,
  );
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-store");
  res.send(png);
}

export async function getVariantQrCode(req: Request, res: Response) {
  const png = await productsService.getVariantQrCodePng(
    requireBusinessId(req),
    req.params.variantId as string,
  );
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "no-store");
  res.send(png);
}
