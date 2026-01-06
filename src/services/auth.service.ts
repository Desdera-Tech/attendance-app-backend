import { ApiResponse } from "../dto/ApiRespnse.ts";
import { CreateAdminRequest } from "../dto/auth/request/CreateAdminRequest.ts";
import { CreateLecturerRequest } from "../dto/auth/request/CreateLecturerRequest.ts";
import { CreateStudentRequest } from "../dto/auth/request/CreateStudentRequest.ts";
import { LoginAdminRequest } from "../dto/auth/request/LoginAdminRequest.ts";
import { LoginLecturerRequest } from "../dto/auth/request/LoginLecturerRequest.ts";
import { LoginStudentRequest } from "../dto/auth/request/LoginStudentRequest.ts";
import { LoginResponse } from "../dto/auth/response/LoginResponse.ts";
import { Admin } from "../entities/Admin.ts";
import { Lecturer } from "../entities/Lecturer.ts";
import { Student } from "../entities/Student.ts";
import { Role } from "../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { passwordCompare, passwordHash } from "../core/utils/password.ts";
import { jwtService, TokenPayload } from "./jwt.service.ts";
import jwt from "jsonwebtoken";
import { HttpError } from "../core/errors/HttpError.ts";
import { BadRequestError } from "../core/errors/BadRequestError.ts";
import { UnauthorizedError } from "../core/errors/UnauthorizedError.ts";
import { schoolService } from "./school.service.ts";
import { adminService } from "./admin.service.ts";
import { userService } from "./user.service.ts";
import { studentService } from "./student.service.ts";
import { CreateSchoolAdminRequest } from "../dto/auth/request/CreateSchoolAdminRequest.ts";
import { User } from "../generated/prisma/client.ts";

export class AuthService {
  async createAdmin(data: CreateAdminRequest): Promise<ApiResponse<Admin>> {
    const { name, email, password } = data;

    if (await adminService.existsByEmail(email)) {
      throw new HttpError(409, "An admin with this email already exists");
    }

    const hashedPassword = await passwordHash(password);

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        role: "ADMIN",
        passwordHash: hashedPassword,
      },
    });

    return {
      data: admin,
      message: "Admin created successfully",
    };
  }

  async createLecturer(
    data: CreateLecturerRequest,
    schoolId: string
  ): Promise<ApiResponse<Lecturer>> {
    const { firstName, lastName, email, phone, password } = data;

    if (!schoolService.existsById(schoolId)) {
      throw new HttpError(404, "School not found!");
    }

    if (await userService.existsByEmail(email, schoolId)) {
      throw new HttpError(
        409,
        "An account with this email already exists in this school"
      );
    }

    const hashedPassword = await passwordHash(password);

    const [user, lecturer] = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: "LECTURER",
          passwordHash: hashedPassword,
          schoolId,
        },
      });

      const lecturer = await prisma.lecturer.create({
        data: {
          id: user.id,
          phone,
          schoolId,
        },
      });

      return [user, lecturer];
    });

    return {
      data: { ...lecturer, ...user },
      message: "Lecturer created successfully",
    };
  }

  async createStudent(
    data: CreateStudentRequest,
    schoolId: string,
    loggedInUserRole: Role
  ): Promise<ApiResponse<Student>> {
    const {
      matricNumber,
      firstName,
      middleName,
      lastName,
      email,
      phone,
      departmentId,
      level,
      role,
      password,
    } = data;
    const userRole = role as Role;

    const allowedCurrentRolesForCustomRole: Role[] = [
      "SUPER_ADMIN",
      "ADMIN",
      "SCHOOL_ADMIN",
    ];

    if (!schoolService.existsById(schoolId)) {
      throw new HttpError(404, "School not found!");
    }

    if (await userService.existsByEmail(email, schoolId)) {
      throw new HttpError(
        409,
        "An account with this email already exists in this school"
      );
    }

    if (await studentService.existsByMatricNumber(matricNumber, schoolId)) {
      throw new HttpError(
        409,
        "A student with this matric number already exists in this school"
      );
    }

    const hashedPassword = await passwordHash(password);
    const [user, student] = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role: allowedCurrentRolesForCustomRole.includes(loggedInUserRole)
            ? userRole
            : "STUDENT",
          passwordHash: hashedPassword,
          schoolId,
        },
      });

      const student = await prisma.student.create({
        data: {
          id: user.id,
          matricNumber,
          middleName,
          departmentId,
          level,
          phone,
          schoolId,
        },
        include: {
          department: {
            select: {
              id: true,
              collegeId: true,
              name: true,
              college: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return [user, student];
    });

    return {
      data: {
        ...student,
        ...user,
        collegeId: student.department.collegeId,
        departmentId: student.departmentId,
        collegeName: student.department.name,
        departmentName: student.department.college.name,
      },
      message: "Student created successfully",
    };
  }

  async createSchoolAdmin(
    data: CreateSchoolAdminRequest,
    schoolId: string
  ): Promise<ApiResponse<User>> {
    const { firstName, lastName, email, password } = data;

    if (!schoolService.existsById(schoolId)) {
      throw new HttpError(404, "School not found!");
    }

    if (await userService.existsByEmail(email, schoolId)) {
      throw new HttpError(
        409,
        "An account with this email already exists in this school"
      );
    }

    const hashedPassword = await passwordHash(password);
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: "SCHOOL_ADMIN",
        passwordHash: hashedPassword,
        schoolId,
      },
    });

    return {
      data: user,
      message: "School admin created successfully",
    };
  }

  async loginAdmin(
    data: LoginAdminRequest
  ): Promise<ApiResponse<LoginResponse<Admin>>> {
    const { email, password } = data;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new BadRequestError("Invalid email or password");
    }

    const isPasswordValid = await passwordCompare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestError("Invalid email or password");
    }

    if (!admin.isActive) {
      throw new HttpError(403, "Admin account is deactivated");
    }

    const { accessToken, refreshToken } = this.generateTokens(
      admin.id,
      admin.role
    );

    return {
      data: {
        data: admin,
        accessToken,
        refreshToken,
      },
      message: "Login successful!",
    };
  }

  async loginLecturer(
    data: LoginLecturerRequest,
    schoolId: string
  ): Promise<ApiResponse<LoginResponse<Lecturer>>> {
    const { email, password } = data;

    if (!schoolService.existsById(schoolId)) {
      throw new HttpError(404, "School not found!");
    }

    const user = await prisma.user.findUnique({
      where: { email_schoolId: { email, schoolId } },
      include: { lecturers: { select: { phone: true } } },
    });

    if (!user) {
      throw new BadRequestError("Invalid email or password");
    }

    const isPasswordValid = await passwordCompare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new HttpError(403, "Lecturer account is deactivated");
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.role
    );

    return {
      data: {
        data: { ...user.lecturers[0], ...user },
        accessToken,
        refreshToken,
      },
      message: "Login successful!",
    };
  }

  async loginStudent(
    data: LoginStudentRequest,
    schoolId: string
  ): Promise<ApiResponse<LoginResponse<Student>>> {
    const { matricNumber, password } = data;

    const student = await prisma.student.findUnique({
      where: { matricNumber_schoolId: { matricNumber, schoolId } },
      include: {
        user: true,
        department: {
          select: {
            id: true,
            collegeId: true,
            name: true,
            college: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new BadRequestError("Invalid Matric number or password");
    }

    const isPasswordValid = await passwordCompare(
      password,
      student.user.passwordHash
    );
    if (!isPasswordValid) {
      throw new BadRequestError("Invalid Matric number or password");
    }

    if (!student.user.isActive) {
      throw new HttpError(403, "Student account is deactivated");
    }

    const studentData: Student = {
      ...student,
      ...student.user,
      collegeId: student.department.collegeId,
      departmentId: student.departmentId,
      collegeName: student.department.name,
      departmentName: student.department.college.name,
    };

    const { accessToken, refreshToken } = this.generateTokens(
      studentData.id,
      studentData.role
    );

    const response: ApiResponse<LoginResponse<Student>> = {
      data: {
        data: studentData,
        accessToken,
        refreshToken,
      },
      message: "Login successful!",
    };
    return response;
  }

  async refresh(
    oldRefreshToken: string
  ): Promise<ApiResponse<LoginResponse<any>>> {
    // Check blacklist
    const blacklisted = await jwtService.isRefreshTokenBlacklisted(
      oldRefreshToken
    );

    if (blacklisted) {
      throw new HttpError(
        403,
        "Refresh token is blacklisted",
        "REFRESH_TOKEN_BLACKLISTED"
      );
    }

    let payload: TokenPayload | null = null;

    try {
      // Verify token
      payload = jwtService.verifyToken(oldRefreshToken);
      if (payload.type !== "refresh") {
        throw new HttpError(403, "Token must be a refresh token");
      }

      // BLACKLIST OLD TOKEN
      await jwtService.blacklistRefreshToken(
        payload.userId,
        oldRefreshToken,
        60 * 60 * 24 * 7
      ); // 7 days
    } catch (error) {
      console.error(error);

      if (error instanceof jwt.JsonWebTokenError) {
        if (error.name === "TokenExpiredError") {
          throw new UnauthorizedError("Token expired", "EXPIRED_TOKEN");
        } else {
          throw new UnauthorizedError("Invalid token", "INVALID_TOKEN");
        }
      }
    }

    if (!payload) {
      throw new HttpError(500, "An error occurred while refreshing token");
    }

    // Generate new tokens
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    return {
      data: {
        accessToken,
        refreshToken,
      },
      message: "Tokens refreshed successfully",
    };
  }

  generateTokens(userId: string, role: Role) {
    const accessToken = jwtService.generateAccessToken({
      userId,
      role,
    });
    const refreshToken = jwtService.generateRefreshToken({
      userId,
      role,
    });

    jwtService.storeRefreshToken(userId, refreshToken, 60 * 60 * 24 * 7);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
