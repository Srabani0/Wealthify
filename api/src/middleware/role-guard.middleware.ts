import type { NextFunction, Request, Response } from "express";
import type { RoleName } from "@wealthify/shared";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

// Must run after authMiddleware — depends on req.user being populated.
export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
