import type { Request, Response } from "express";
import {
  formatBillNumber,
  type CreateOrderInput,
  type OrderListQueryInput,
  type OrderSummaryQueryInput,
  type UpdateOrderInput,
} from "@wealthify/shared";
import * as ordersService from "./orders.service.js";
import { sendList, sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export async function listOrders(req: Request, res: Response) {
  const query = req.query as unknown as OrderListQueryInput;
  const { items, total } = await ordersService.listOrders(requireUser(req).businessId, query);
  sendList(res, items, { page: query.page, pageSize: query.pageSize, total });
}

export async function createOrder(req: Request, res: Response) {
  const { businessId, userId } = requireUser(req);
  const input = req.body as CreateOrderInput;
  const order = await ordersService.createOrder(businessId, userId, input);
  sendSuccess(res, order, 201, "Order logged");
}

export async function updateOrder(req: Request, res: Response) {
  const { businessId, userId } = requireUser(req);
  const input = req.body as UpdateOrderInput;
  const order = await ordersService.updateOrder(businessId, userId, req.params.id as string, input);
  sendSuccess(res, order, 200, input.status === "CANCELLED" ? "Order cancelled" : "Order updated");
}

export async function getOrderSummary(req: Request, res: Response) {
  const query = req.query as unknown as OrderSummaryQueryInput;
  const summary = await ordersService.getOrderSummary(requireUser(req).businessId, query.from, query.to);
  sendSuccess(res, summary);
}

export async function getOrderBill(req: Request, res: Response) {
  const { businessId } = requireUser(req);
  const orderId = req.params.id as string;
  const { buffer, billNumber } = await ordersService.getOrderBillPdf(businessId, orderId);
  const filename = billNumber ? `${formatBillNumber(billNumber)}.pdf` : `bill-${orderId}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(buffer);
}
