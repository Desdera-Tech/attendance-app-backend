import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../dto/ApiRespnse.ts";
import { jwtService } from "../services/jwt.service.ts";

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
      const response: ApiResponse<string> = {
        data: null,
        success: false,
        statusCode: 500,
        message: error as string,
      };
      return res.status(response.statusCode).json(response);
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
      const response: ApiResponse<string> = {
        data: null,
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
