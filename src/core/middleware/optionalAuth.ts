import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { jwtService } from "../../services/jwt.service";
import { HttpError } from "../errors/HttpError";
import { UnauthorizedError } from "../errors/UnauthorizedError";

export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return next(); // public access allowed
    }

    const token = header.split(" ")[1];

    try {
      const payload = jwtService.verifyToken(token);

      if (payload.type !== "access") {
        throw new HttpError(403, "Token must be an access token");
      }

      req.auth = { userId: payload.userId, role: payload.role };
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        if (error.name === "TokenExpiredError") {
          throw new UnauthorizedError("Token expired", "EXPIRED_TOKEN");
        }
        throw new UnauthorizedError("Invalid token", "INVALID_TOKEN");
      }

      throw error; // never swallow
    }
  }
);
