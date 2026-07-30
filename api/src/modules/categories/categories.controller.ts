import type { Request, Response } from "express";
import type { CreateCategoryInput, UpdateCategoryInput } from "@wealthify/shared";
import * as categoriesService from "./categories.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listCategories(req: Request, res: Response) {
  const categories = await categoriesService.listCategories(requireBusinessId(req));
  sendSuccess(res, categories);
}

export async function createCategory(req: Request, res: Response) {
  const input = req.body as CreateCategoryInput;
  const category = await categoriesService.createCategory(requireBusinessId(req), input);
  sendSuccess(res, category, 201, "Category created");
}

export async function updateCategory(req: Request, res: Response) {
  const input = req.body as UpdateCategoryInput;
  const category = await categoriesService.updateCategory(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, category, 200, "Category updated");
}

export async function deleteCategory(req: Request, res: Response) {
  await categoriesService.deleteCategory(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Category deleted");
}
