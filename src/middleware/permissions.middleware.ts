import { Request, Response } from "express";
import { Role } from "../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { User } from "../entities/User.ts";
import { requireAuth } from "./auth.middleware.ts";
import { ApiResponse } from "../dto/ApiRespnse.ts";

const withPermissions =
  (
    requiredRole: Role | Role[],
    error: string,
    handler: (req: Request, res: Response, user: User) => any
  ) =>
  async (req: Request, res: Response) => {
    requireAuth(req, res, async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.auth?.userId },
        });
        const roles = Array.isArray(requiredRole)
          ? requiredRole
          : [requiredRole];

        if (!user || !roles.includes(user.role)) {
          const response: ApiResponse<null> = {
            data: null,
            success: false,
            statusCode: 403,
            message: error,
          };

          return res.status(response.statusCode).json(response);
        }

        return handler(req, res, user);
      } catch (err) {
        console.error(err);
        const response: ApiResponse<null> = {
          data: null,
          success: false,
          statusCode: 500,
          message: "Server error",
        };
        return res.status(response.statusCode).json(response);
      }
    });
  };

export default withPermissions;
