import { authController } from "../controllers/auth.controller.ts";
import { Router } from "express";
import { Role } from "../generated/prisma/enums.ts";
import withPermissions from "../middleware/permissions.middleware.ts";

const router = Router();

// POST /auth/create-super-admin
router.post("/create-super-admin", authController.createAdmin);

// POST /auth/create-admin
router.post(
  "/create-admin",
  withPermissions(Role.ADMIN, "Forbidden: Super admin only", async (req, res) =>
    authController.createAdmin(req, res)
  )
);

export default router;
