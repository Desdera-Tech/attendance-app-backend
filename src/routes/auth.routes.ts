import { Router } from "express";
import { Role } from "../generated/prisma/enums.ts";
import { requireAuth } from "../core/middleware/requireAuth.ts";
import { requireRole } from "../core/middleware/requireRole.ts";
import {
  createAdmin,
  loginAdmin,
  createLecturer,
  loginLecturer,
  createStudent,
  loginStudent,
  createSchoolAdmin,
} from "../controllers/auth.controller.ts";

const router = Router();

router.post("/create-super-admin", createAdmin);

router.post(
  "/create-admin",
  requireAuth,
  requireRole(Role.SUPER_ADMIN),
  createAdmin
);

router.post("/login-admin", loginAdmin);

router.post(
  "/:schoolId/create-lecturer",
  requireAuth,
  requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.SCHOOL_ADMIN]),
  createLecturer
);

router.post("/:schoolId/login-lecturer", loginLecturer);

router.post(
  "/:schoolId/create-student",
  requireAuth,
  requireRole([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.SCHOOL_ADMIN,
    Role.COURSE_REP,
    Role.ASST_COURSE_REP,
  ]),
  createStudent
);

router.post("/:schoolId/login-student", loginStudent);

router.post(
  "/:schoolId/create-admin",
  requireAuth,
  requireRole([Role.SUPER_ADMIN, Role.ADMIN]),
  createSchoolAdmin
);

export default router;
