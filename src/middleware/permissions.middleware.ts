import { Request, Response } from "express";
import { Role } from "../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { User } from "../entities/User.ts";
import { getAuth } from "@clerk/express";
import authMiddleware from "./auth.middleware.ts";

const withPermissions =
  (
    requiredRole: Role | Role[],
    error: string,
    handler: (req: Request, res: Response, user: User) => any
  ) =>
  async (req: Request, res: Response) => {
    authMiddleware(req, res, async () => {
      try {
        const { userId } = getAuth(req);

        const user = await prisma.user.findUnique({
          where: { clerkId: userId! },
        });
        const roles = Array.isArray(requiredRole)
          ? requiredRole
          : [requiredRole];

        if (!user || !roles.includes(user.role)) {
          return res.status(403).json({ error });
        }

        return handler(req, res, user);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }
    });
  };

export default withPermissions;
