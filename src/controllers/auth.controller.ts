import { Request, Response } from "express";
import { createAdminRequest } from "../dto/auth/request/CreateAdminRequest.ts";
import { authService } from "../services/auth.service.ts";
import { createLecturerRequest } from "../dto/auth/request/CreateLecturerRequest.ts";
import { createStudentRequest } from "../dto/auth/request/CreateStudentRequest.ts";
import { loginAdminRequest } from "../dto/auth/request/LoginAdminRequest.ts";
import { loginLecturerRequest } from "../dto/auth/request/LoginLecturerRequest.ts";
import { loginStudentRequest } from "../dto/auth/request/LoginStudentRequest.ts";
import { asyncHandler } from "../core/utils/asyncHandler.ts";
import { BadRequestError } from "../core/errors/BadRequestError.ts";

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const data = createAdminRequest.parse(req.body);
  const response = await authService.createAdmin(data);
  res.status(201).json(response);
});

export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const data = loginAdminRequest.parse(req.body);
  const response = await authService.loginAdmin(data);
  res.status(200).json(response);
});

export const createLecturer = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params;

    const data = createLecturerRequest.parse(req.body);
    const response = await authService.createLecturer(data, schoolId);
    res.status(201).json(response);
  }
);

export const loginLecturer = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params;

    const data = loginLecturerRequest.parse(req.body);
    const response = await authService.loginLecturer(data, schoolId);
    res.status(201).json(response);
  }
);

export const createStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const role = req.auth!.role;
    const { schoolId } = req.params;

    const data = createStudentRequest.parse(req.body);
    const response = await authService.createStudent(data, schoolId, role);
    res.status(201).json(response);
  }
);

export const loginStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params;

    const data = loginStudentRequest.parse(req.body);
    const response = await authService.loginStudent(data, schoolId);
    res.status(201).json(response);
  }
);

export const createSchoolAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params;

    const data = createStudentRequest.parse(req.body);
    const response = await authService.createSchoolAdmin(data, schoolId);
    res.status(201).json(response);
  }
);

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.headers["x-refresh-token"] as string | undefined;

  if (!refreshToken) {
    throw new BadRequestError("Missing refresh token");
  }

  const response = await authService.refresh(refreshToken);
  res.status(200).json(response);
});
