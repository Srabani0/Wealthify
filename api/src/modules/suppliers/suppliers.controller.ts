import type { Request, Response } from "express";
import type { CreateSupplierInput, UpdateSupplierInput } from "@wealthify/shared";
import * as suppliersService from "./suppliers.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listSuppliers(req: Request, res: Response) {
  const suppliers = await suppliersService.listSuppliers(requireBusinessId(req));
  sendSuccess(res, suppliers);
}

export async function createSupplier(req: Request, res: Response) {
  const input = req.body as CreateSupplierInput;
  const supplier = await suppliersService.createSupplier(requireBusinessId(req), input);
  sendSuccess(res, supplier, 201, "Supplier added");
}

export async function updateSupplier(req: Request, res: Response) {
  const input = req.body as UpdateSupplierInput;
  const supplier = await suppliersService.updateSupplier(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, supplier, 200, "Supplier updated");
}

export async function deleteSupplier(req: Request, res: Response) {
  await suppliersService.deleteSupplier(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Supplier removed");
}
