import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums.ts";
import { HttpError } from "../errors/HttpError.ts";
import { UnauthorizedError } from "../errors/UnauthorizedError.ts";

export const requireRole =
  (roles: Role | Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw new UnauthorizedError("Unauthorized");
    }

    const allowed = Array.isArray(roles) ? roles : [roles];

    if (!allowed.includes(req.auth.role)) {
      throw new HttpError(403, "Forbidden");
    }

    next();
  };
