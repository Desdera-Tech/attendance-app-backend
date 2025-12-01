import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../dto/ApiRespnse.ts";
import { jwtService } from "../services/jwt.service.ts";
import jwt from "jsonwebtoken";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string | null = null;

  const header = req.headers.authorization;
  if (header) {
    token = header.split(" ")[1];
  }

  if (token) {
    try {
      const payload = jwtService.verifyAccessToken(token);

      req.auth = { userId: payload.userId, role: payload.role };
    } catch (error) {
      console.error(error);

      if (error instanceof jwt.JsonWebTokenError) {
        if (error.name === "TokenExpiredError") {
          const response: ApiResponse<null> = {
            name: "EXPIRED_TOKEN",
            success: false,
            statusCode: 401,
            message: "Token expired",
          };
          return res.status(response.statusCode).json(response);
        } else {
          const response: ApiResponse<null> = {
            name: "INVALID_TOKEN",
            success: false,
            statusCode: 401,
            message: "Invalid token",
          };
          return res.status(response.statusCode).json(response);
        }
      }
    }
  }

  return next();
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  authMiddleware(req, res, async () => {
    if (!req.auth) {
      const response: ApiResponse<null> = {
        name: "UNAUTHORIZED",
        success: false,
        statusCode: 401,
        message: "Unauthorized",
      };
      return res.status(response.statusCode).json(response);
    }
    next();
  });
};

export default authMiddleware;
