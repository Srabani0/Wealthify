import type { Request, Response } from "express";
import type { CreateCustomerInput, UpdateCustomerInput } from "@wealthify/shared";
import * as customersService from "./customers.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listCustomers(req: Request, res: Response) {
  const customers = await customersService.listCustomers(requireBusinessId(req));
  sendSuccess(res, customers);
}

export async function createCustomer(req: Request, res: Response) {
  const input = req.body as CreateCustomerInput;
  const customer = await customersService.createCustomer(requireBusinessId(req), input);
  sendSuccess(res, customer, 201, "Customer added");
}

export async function updateCustomer(req: Request, res: Response) {
  const input = req.body as UpdateCustomerInput;
  const customer = await customersService.updateCustomer(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, customer, 200, "Customer updated");
}

export async function deleteCustomer(req: Request, res: Response) {
  await customersService.deleteCustomer(requireBusinessId(req), req.params.id as string);
  sendSuccess(res, null, 200, "Customer removed");
}
