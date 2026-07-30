import type { Request, Response } from "express";
import type { CreateBrandInput, UpdateBrandInput } from "@wealthify/shared";
import * as brandsService from "./brands.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listBrands(req: Request, res: Response) {
  const brands = await brandsService.listBrands(requireBusinessId(req));
  sendSuccess(res, brands);
}

export async function createBrand(req: Request, res: Response) {
  const input = req.body as CreateBrandInput;
  const brand = await brandsService.createBrand(requireBusinessId(req), input);
  sendSuccess(res, brand, 201, "Brand created");
}

export async function updateBrand(req: Request, res: Response) {
  const input = req.body as UpdateBrandInput;
  const brand = await brandsService.updateBrand(requireBusinessId(req), req.params.id as string, input);
  sendSuccess(res, brand, 200, "Brand updated");
}

export async function deleteBrand(req: Request, res: Response) {
  await brandsService.deleteBrand(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Brand deleted");
}
