import type { Request, Response } from "express";
import type { CreateRawMaterialInput, UpdateRawMaterialInput } from "@wealthify/shared";
import * as rawMaterialsService from "./raw-materials.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listRawMaterials(req: Request, res: Response) {
  const materials = await rawMaterialsService.listRawMaterials(requireBusinessId(req));
  sendSuccess(res, materials);
}

export async function createRawMaterial(req: Request, res: Response) {
  const input = req.body as CreateRawMaterialInput;
  const material = await rawMaterialsService.createRawMaterial(requireBusinessId(req), input);
  sendSuccess(res, material, 201, "Raw material added");
}

export async function updateRawMaterial(req: Request, res: Response) {
  const input = req.body as UpdateRawMaterialInput;
  const material = await rawMaterialsService.updateRawMaterial(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, material, 200, "Raw material updated");
}

export async function deleteRawMaterial(req: Request, res: Response) {
  await rawMaterialsService.deleteRawMaterial(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Raw material removed");
}
