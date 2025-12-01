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
  withPermissions(
    Role.SUPER_ADMIN,
    "Forbidden: You're not allowed to do this",
    async (req, res) => authController.createAdmin(req, res)
  )
);

// POST /auth/login-admin
router.post("/login-admin", authController.loginAdmin);

// POST /auth/create-lecturer
router.post(
  "/create-lecturer",
  withPermissions(
    Role.SUPER_ADMIN,
    "Forbidden: You're not allowed to do this",
    async (req, res) => authController.createLecturer(req, res)
  )
);

// POST /auth/login-lecturer
router.post("/login-lecturer", authController.loginLecturer);

// POST /auth/create-student
router.post(
  "/create-student",
  withPermissions(
    [Role.SUPER_ADMIN, Role.ADMIN, Role.COURSE_REP, Role.ASST_COURSE_REP],
    "Forbidden: You're not allowed to do this",
    authController.createStudent
  )
);

// POST /auth/login-student
router.post("/login-student", authController.loginStudent);

export default router;
