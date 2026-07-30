import type { Request, Response } from "express";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "@wealthify/shared";
import * as authService from "./auth.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

export async function register(req: Request, res: Response) {
  const input = req.body as RegisterInput;
  const result = await authService.registerBusiness(input);
  sendSuccess(res, result, 201, "Business registered successfully");
}

export async function login(req: Request, res: Response) {
  const input = req.body as LoginInput;
  const result = await authService.login(input);
  sendSuccess(res, result, 200, "Logged in successfully");
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const result = await authService.getMe(req.user.userId);
  sendSuccess(res, result);
}

export async function forgotPassword(req: Request, res: Response) {
  const input = req.body as ForgotPasswordInput;
  await authService.requestPasswordReset(input.email);
  // Always the same response, whether or not the email exists.
  sendSuccess(res, null, 200, "If that email exists, a reset link has been sent");
}

export async function resetPassword(req: Request, res: Response) {
  const input = req.body as ResetPasswordInput;
  await authService.resetPassword(input.token, input.password);
  sendSuccess(res, null, 200, "Password reset successfully");
}
