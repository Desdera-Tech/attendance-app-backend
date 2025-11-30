import { Request, Response } from "express";
import { createAdminRequest } from "../dto/auth/request/CreateAdminRequest.ts";
import { authService } from "../services/auth.service.ts";

export const authController = {
  async createAdmin(req: Request, res: Response) {
    try {
      // Validate incoming body
      const data = createAdminRequest.parse(req.body);

      const admin = await authService.createAdmin(data);

      res.status(201).json({
        message: "Admin created successfully",
        data: admin,
      });
    } catch (err: any) {
      console.error(err);

      return res.status(400).json({
        error: err.message || "Failed to create admin",
      });
    }
  },
};
