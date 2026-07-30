import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../lib/errors.js";

type RequestPart = "body" | "query" | "params";

// Parses in place so controllers read the coerced/defaulted value (e.g.
// numeric query params) rather than the raw string from Express.
export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      next(new ValidationError("Validation failed", errors));
      return;
    }

    req[part] = result.data;
    next();
  };
}
