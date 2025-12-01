import { Request, Response } from "express";
import { createAdminRequest } from "../dto/auth/request/CreateAdminRequest.ts";
import { authService } from "../services/auth.service.ts";
import { createLecturerRequest } from "../dto/auth/request/CreateLecturerRequest.ts";
import { createStudentRequest } from "../dto/auth/request/CreateStudentRequest.ts";
import { User } from "../entities/User.ts";
import { loginAdminRequest } from "../dto/auth/request/LoginAdminRequest.ts";
import { loginLecturerRequest } from "../dto/auth/request/LoginLecturerRequest.ts";
import { loginStudentRequest } from "../dto/auth/request/LoginStudentRequest.ts";

export class AuthController {
  async createAdmin(req: Request, res: Response) {
    try {
      // Validate incoming body
      const data = createAdminRequest.parse(req.body);

      const response = await authService.createAdmin(data);

      res.status(response.statusCode).json(response);
    } catch (err: any) {
      console.error(err);

      return res.status(400).json({
        error: err.message || "Failed to create admin",
      });
    }
  }

  async loginAdmin(req: Request, res: Response) {
    try {
      // Validate incoming body
      const data = loginAdminRequest.parse(req.body);

      const response = await authService.loginAdmin(data);

      res.status(response.statusCode).json(response);
    } catch (err: any) {
      console.error(err);

      return res.status(400).json({
        error: err.message || "Failed to login as admin",
      });
    }
  }

  async createLecturer(req: Request, res: Response) {
    try {
      // Validate incoming body
      const data = createLecturerRequest.parse(req.body);

      const response = await authService.createLecturer(data);

      res.status(response.statusCode).json(response);
    } catch (err: any) {
      console.error(err);

      return res.status(400).json({
        error: err.message || "Failed to create lecturer",
      });
    }
  }

  async loginLecturer(req: Request, res: Response) {
    try {
      // Validate incoming body
      const data = loginLecturerRequest.parse(req.body);

      const response = await authService.loginLecturer(data);

      res.status(response.statusCode).json(response);
    } catch (err: any) {
      console.error(err);

      return res.status(400).json({
        error: err.message || "Failed to login as lecturer",
      });
    }
  }

  async createStudent(req: Request, res: Response, loggedInUser: User) {
    try {
      // Validate incoming body
      const data = createStudentRequest.parse(req.body);

      const response = await authService.createStudent(data, loggedInUser);

      res.status(response.statusCode).json(response);
    } catch (err: any) {
      console.error(err);

      return res.status(400).json({
        error: err.message || "Failed to create student",
      });
    }
  }

  async loginStudent(req: Request, res: Response) {
    try {
      // Validate incoming body
      const data = loginStudentRequest.parse(req.body);

      const response = await authService.loginStudent(data);

      res.status(response.statusCode).json(response);
    } catch (err: any) {
      console.error(err);

      return res.status(400).json({
        error: err.message || "Failed to login as student",
      });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
    } catch (error) {}
  }
}

export const authController = new AuthController();
