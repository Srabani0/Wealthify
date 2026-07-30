import type { Request, Response } from "express";
import type { CreateUserInput, UpdateUserInput } from "@wealthify/shared";
import * as usersService from "./users.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

function requireBusinessId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.businessId;
}

export async function listUsers(req: Request, res: Response) {
  const users = await usersService.listUsers(requireBusinessId(req));
  sendSuccess(res, users);
}

export async function createUser(req: Request, res: Response) {
  const input = req.body as CreateUserInput;
  const user = await usersService.createUser(requireBusinessId(req), input);
  sendSuccess(res, user, 201, "User created");
}

export async function updateUser(req: Request, res: Response) {
  const input = req.body as UpdateUserInput;
  const user = await usersService.updateUser(
    requireBusinessId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, user, 200, "User updated");
}
