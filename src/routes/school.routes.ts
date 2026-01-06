import { Router } from "express";
import { requireAuth } from "../core/middleware/requireAuth";
import { requireRole } from "../core/middleware/requireRole";
import { Role } from "../generated/prisma/enums";
import {
  createSchool,
  editSchool,
  getSchool,
} from "../controllers/school.controller.ts";

const router = Router();

router.post(
  "/create",
  requireAuth,
  requireRole([Role.SUPER_ADMIN, Role.ADMIN]),
  createSchool
);

router.post(
  "/:schoolId/edit",
  requireAuth,
  requireRole([Role.SUPER_ADMIN, Role.ADMIN]),
  editSchool
);

router.get("/:schoolId", requireAuth, getSchool);

export default router;
