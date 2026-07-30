import type { Request, Response } from "express";
import type {
  CreatePurchaseInput,
  PurchaseListQueryInput,
  PurchaseSummaryQueryInput,
  UpdatePurchaseInput,
} from "@wealthify/shared";
import * as purchasesService from "./purchases.service.js";
import { sendList, sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listPurchases(req: Request, res: Response) {
  const query = req.query as unknown as PurchaseListQueryInput;
  const { items, total } = await purchasesService.listPurchases(requireBusinessId(req), query);
  sendList(res, items, { page: query.page, pageSize: query.pageSize, total });
}

export async function createPurchase(req: Request, res: Response) {
  const input = req.body as CreatePurchaseInput;
  const purchase = await purchasesService.createPurchase(requireBusinessId(req), input);
  sendSuccess(res, purchase, 201, "Purchase logged");
}

export async function updatePurchase(req: Request, res: Response) {
  const input = req.body as UpdatePurchaseInput;
  const purchase = await purchasesService.updatePurchase(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, purchase, 200, "Purchase updated");
}

export async function deletePurchase(req: Request, res: Response) {
  await purchasesService.deletePurchase(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Purchase deleted");
}

export async function getPurchaseSummary(req: Request, res: Response) {
  const query = req.query as unknown as PurchaseSummaryQueryInput;
  const summary = await purchasesService.getPurchaseSummary(requireBusinessId(req), query.from, query.to);
  sendSuccess(res, summary);
}
