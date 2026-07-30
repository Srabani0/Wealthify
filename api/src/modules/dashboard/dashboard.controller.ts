import type { Request, Response } from "express";
import type { DashboardSummaryQueryInput } from "@wealthify/shared";
import * as dashboardService from "./dashboard.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

export async function getDashboardSummary(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const query = req.query as unknown as DashboardSummaryQueryInput;
  const summary = await dashboardService.getDashboardSummary(req.user.businessId, query.from, query.to);
  sendSuccess(res, summary);
}
