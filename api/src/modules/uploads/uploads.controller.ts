import type { Request, Response } from "express";
import type { SignUploadInput } from "@wealthify/shared";
import * as uploadsService from "./uploads.service.js";
import { sendSuccess } from "../../lib/response.js";
import { UnauthorizedError } from "../../lib/errors.js";

export async function signUpload(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const input = req.body as SignUploadInput;
  const result = uploadsService.createUploadSignature(req.user.businessId, input);
  sendSuccess(res, result);
}
