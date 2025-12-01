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
import { User } from "../entities/User.ts";
import { Role } from "../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { passwordCompare, passwordHash } from "../utils/password.ts";
import { jwtService, TokenPayload } from "./jwt.service.ts";
import jwt from "jsonwebtoken";

export class AuthService {
  async createAdmin(data: CreateAdminRequest): Promise<ApiResponse<Admin>> {
    const { name, email, password } = data;

    if (await prisma.admin.findUnique({ where: { email } })) {
      const response: ApiResponse<Admin> = {
        data: null,
        success: false,
        statusCode: 409,
        message: "Admin with this email already exists",
      };
      return response;
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

    const response: ApiResponse<Admin> = {
      data: admin,
      success: true,
      statusCode: 201,
      message: "Admin created successfully",
    };
    return response;
  }

  async createLecturer(
    data: CreateLecturerRequest
  ): Promise<ApiResponse<Lecturer>> {
    const { firstName, lastName, email, phone, password } = data;

    if (await prisma.user.findUnique({ where: { email } })) {
      const response: ApiResponse<Lecturer> = {
        data: null,
        success: false,
        statusCode: 409,
        message: "An account with this email already exists",
      };
      return response;
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
        },
      });

      const lecturer = await prisma.lecturer.create({
        data: {
          id: user.id,
          phone,
        },
      });

      return [user, lecturer];
    });

    const response: ApiResponse<Lecturer> = {
      data: { ...lecturer, ...user } as Lecturer,
      success: false,
      statusCode: 201,
      message: "Lecturer created successfully",
    };
    return response;
  }

  async createStudent(
    data: CreateStudentRequest,
    loggedInUser: User
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
      "COURSE_REP",
    ];

    if (await prisma.user.findUnique({ where: { email } })) {
      const response: ApiResponse<Student> = {
        data: null,
        success: false,
        statusCode: 409,
        message: "An account with this email already exists",
      };
      return response;
    }

    if (await prisma.student.findUnique({ where: { matricNumber } })) {
      const response: ApiResponse<Student> = {
        data: null,
        success: false,
        statusCode: 409,
        message: "An student with this matric number already exists",
      };
      return response;
    }

    const hashedPassword = await passwordHash(password);
    const [user, student] = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role:
            allowedCurrentRolesForCustomRole.includes(loggedInUser.role) &&
            loggedInUser.role !== "COURSE_REP"
              ? userRole
              : "STUDENT",
          passwordHash: hashedPassword,
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
        },
      });

      return [user, student];
    });

    const response: ApiResponse<Student> = {
      data: { ...student, ...user } as Student,
      success: false,
      statusCode: 201,
      message: "Student created successfully",
    };
    return response;
  }

  async loginAdmin(
    data: LoginAdminRequest
  ): Promise<ApiResponse<LoginResponse<Admin>>> {
    const { email, password } = data;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      const response: ApiResponse<LoginResponse<Admin>> = {
        data: null,
        success: false,
        statusCode: 401,
        message: "Invalid email or password",
      };
      return response;
    }

    const isPasswordValid = await passwordCompare(password, admin.passwordHash);
    if (!isPasswordValid) {
      const response: ApiResponse<LoginResponse<Admin>> = {
        data: null,
        success: false,
        statusCode: 401,
        message: "Invalid email or password",
      };
      return response;
    }

    if (!admin.isActive) {
      const response: ApiResponse<LoginResponse<Admin>> = {
        data: null,
        success: false,
        statusCode: 403,
        message: "Admin account is deactivated",
      };
      return response;
    }

    const { accessToken, refreshToken } = this.generateTokens(
      admin.id,
      admin.role
    );

    const responseData: LoginResponse<Admin> = {
      data: admin,
      accessToken,
      refreshToken,
    };

    const response: ApiResponse<LoginResponse<Admin>> = {
      data: responseData,
      success: true,
      statusCode: 200,
      message: "Login successful!",
    };
    return response;
  }

  async loginLecturer(
    data: LoginLecturerRequest
  ): Promise<ApiResponse<LoginResponse<Lecturer>>> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { lecturers: { select: { phone: true } } },
    });

    if (!user) {
      const response: ApiResponse<LoginResponse<Lecturer>> = {
        data: null,
        success: false,
        statusCode: 401,
        message: "Invalid email or password",
      };
      return response;
    }

    const isPasswordValid = await passwordCompare(password, user.passwordHash);
    if (!isPasswordValid) {
      const response: ApiResponse<LoginResponse<Lecturer>> = {
        data: null,
        success: false,
        statusCode: 401,
        message: "Invalid email or password",
      };
      return response;
    }

    if (!user.isActive) {
      const response: ApiResponse<LoginResponse<Lecturer>> = {
        data: null,
        success: false,
        statusCode: 403,
        message: "Lecturer account is deactivated",
      };
      return response;
    }

    const lecturer = { ...user.lecturers[0], ...user } as Lecturer;

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.role
    );

    const responseData: LoginResponse<Lecturer> = {
      data: lecturer,
      accessToken,
      refreshToken,
    };

    const response: ApiResponse<LoginResponse<Lecturer>> = {
      data: responseData,
      success: true,
      statusCode: 200,
      message: "Login successful!",
    };
    return response;
  }

  async loginStudent(
    data: LoginStudentRequest
  ): Promise<ApiResponse<LoginResponse<Student>>> {
    const { matricNumber, password } = data;

    const student = await prisma.student.findUnique({
      where: { matricNumber },
      include: { user: true },
    });

    if (!student) {
      const response: ApiResponse<LoginResponse<Student>> = {
        data: null,
        success: false,
        statusCode: 401,
        message: "Invalid Matric number or password",
      };
      return response;
    }

    const isPasswordValid = await passwordCompare(
      password,
      student.user.passwordHash
    );
    if (!isPasswordValid) {
      const response: ApiResponse<LoginResponse<Student>> = {
        data: null,
        success: false,
        statusCode: 401,
        message: "Invalid Matric number or password",
      };
      return response;
    }

    if (!student.user.isActive) {
      const response: ApiResponse<LoginResponse<Student>> = {
        data: null,
        success: false,
        statusCode: 403,
        message: "Student account is deactivated",
      };
      return response;
    }

    const studentData = { ...student, ...student.user } as Student;

    const { accessToken, refreshToken } = this.generateTokens(
      studentData.id,
      studentData.role
    );

    const responseData: LoginResponse<Student> = {
      data: studentData,
      accessToken,
      refreshToken,
    };

    const response: ApiResponse<LoginResponse<Student>> = {
      data: responseData,
      success: true,
      statusCode: 200,
      message: "Login successful!",
    };
    return response;
  }

  async refresh(
    oldRefreshToken: string
  ): Promise<ApiResponse<LoginResponse<null>>> {
    // Check blacklist
    const blacklisted = await jwtService.isRefreshTokenBlacklisted(
      oldRefreshToken
    );

    if (blacklisted) {
      const response: ApiResponse<LoginResponse<null>> = {
        name: "REFRESH_TOKEN_BLACKLISTED",
        success: false,
        statusCode: 403,
        message: "Refresh token is blacklisted",
      };
      return response;
    }

    let payload: TokenPayload | null = null;

    try {
      // Verify token
      payload = jwtService.verifyRefreshToken(oldRefreshToken);

      // BLACKLIST OLD TOKEN
      await jwtService.blacklistRefreshToken(oldRefreshToken, 60 * 60 * 24 * 7); // 7 days
    } catch (error) {
      console.error(error);

      if (error instanceof jwt.JsonWebTokenError) {
        if (error.name === "TokenExpiredError") {
          const response: ApiResponse<LoginResponse<null>> = {
            name: "EXPIRED_TOKEN",
            success: false,
            statusCode: 401,
            message: "Token expired",
          };
          return response;
        } else {
          const response: ApiResponse<LoginResponse<null>> = {
            name: "INVALID_TOKEN",
            success: false,
            statusCode: 401,
            message: "Invalid token",
          };
          return response;
        }
      }
    }

    if (!payload) {
      const response: ApiResponse<LoginResponse<null>> = {
        success: false,
        statusCode: 500,
        message: "An error occurred while refreshing token",
      };
      return response;
    }

    // Generate new tokens
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    const response: ApiResponse<LoginResponse<null>> = {
      data: {
        accessToken,
        refreshToken,
      } as LoginResponse<null>,
      success: false,
      statusCode: 200,
      message: "Tokens refreshed successfully",
    };
    return response;
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
