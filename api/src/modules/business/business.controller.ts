import type { Request, Response } from "express";
import type { UpdateBusinessInput, UpdateBusinessLogoInput } from "@wealthify/shared";
import * as businessService from "./business.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function getBusiness(req: Request, res: Response) {
  const business = await businessService.getBusiness(requireBusinessId(req));
  sendSuccess(res, business);
}

export async function updateBusiness(req: Request, res: Response) {
  const input = req.body as UpdateBusinessInput;
  const business = await businessService.updateBusiness(requireBusinessId(req), input);
  sendSuccess(res, business, 200, "Business profile updated");
}

export async function updateBusinessLogo(req: Request, res: Response) {
  const input = req.body as UpdateBusinessLogoInput;
  const business = await businessService.updateBusinessLogo(requireBusinessId(req), input);
  sendSuccess(res, business, 200, "Logo updated");
}
