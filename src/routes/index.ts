import { Router } from "express";
import authRoutes from "./auth.routes.ts";
import schoolRoutes from "./school.routes.ts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/school", schoolRoutes);

export default router;
