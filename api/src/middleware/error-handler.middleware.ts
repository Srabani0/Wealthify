import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

// Mounted last in app.ts. Express recognizes this as an error handler by its
// four-argument arity — do not drop the unused `_next` param.
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Unique constraint violations surface from services that didn't pre-check
  // (e.g. race conditions on email/SKU uniqueness) — map to 409 rather than 500.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({
      success: false,
      message: `A record with this ${(err.meta?.target as string[] | undefined)?.join(", ") ?? "value"} already exists`,
    });
    return;
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, "Unhandled error");
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
  });
}
