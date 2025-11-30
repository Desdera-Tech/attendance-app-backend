import { clerkClient } from "@clerk/express";
import { CreateAdminRequest } from "../dto/auth/request/CreateAdminRequest.ts";
import { CreateLecturerRequest } from "../dto/auth/request/CreateLecturerRequest.ts";
import { CreateStudentRequest } from "../dto/auth/request/CreateStudentRequest.ts";
import { Lecturer } from "../entities/Lecturer.ts";
import { Student } from "../entities/Student.ts";
import { User } from "../entities/User.ts";
import { Role } from "../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { passwordHash } from "../utils/password.ts";

export const authService = {
  async createAdmin(data: CreateAdminRequest): Promise<User> {
    const { firstName, lastName, email, password } = data;

    let clerkId: string | null = null;

    try {
      // 2. Create the user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        firstName,
        lastName,
      });

      clerkId = clerkUser.id; // store the ID in case we need to roll back

      // 3. Create the user in Prisma
      const hashedPassword = await passwordHash(password);

      const user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName,
          lastName,
          role: "ADMIN",
          passwordHash: hashedPassword,
        },
      });

      return user;
    } catch (error) {
      // 4. Rollback Clerk user if Prisma creation failed
      if (clerkId) {
        try {
          await clerkClient.users.deleteUser(clerkId);
        } catch (rollbackError) {
          console.error("Failed to rollback Clerk user:", rollbackError);
        }
      }

      throw error; // rethrow so the controller can handle it
    }
  },

  async createLecturer(data: CreateLecturerRequest): Promise<Lecturer> {
    const { firstName, lastName, email, phone, password } = data;

    let clerkId: string | null = null;

    try {
      // 2. Create the user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password,
        firstName,
        lastName,
      });

      clerkId = clerkUser.id; // store the ID in case we need to roll back

      // 3. Create the user in Prisma
      const hashedPassword = await passwordHash(password);
      const [user, lecturer] = await prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
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

      return { ...lecturer, ...user } as Lecturer;
    } catch (error) {
      // 4. Rollback Clerk user if Prisma creation failed
      if (clerkId) {
        try {
          await clerkClient.users.deleteUser(clerkId);
        } catch (rollbackError) {
          console.error("Failed to rollback Clerk user:", rollbackError);
        }
      }

      throw error; // rethrow so the controller can handle it
    }
  },

  async createStudent(
    data: CreateStudentRequest,
    currentUser: User
  ): Promise<Student> {
    const {
      matricNumber,
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      level,
      role,
      password,
    } = data;

    let clerkId: string | null = null;
    const userRole = role as Role;

    const allowedCurrentRolesForCustomRole: Role[] = [
      "SUPER_ADMIN",
      "ADMIN",
      "COURSE_REP",
    ];

    try {
      // 2. Create the user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        username: matricNumber,
        emailAddress: [email],
        password,
        firstName,
        lastName,
      });

      clerkId = clerkUser.id; // store the ID in case we need to roll back

      // 3. Create the user in Prisma (transaction optional if multiple writes)
      const hashedPassword = await passwordHash(password);
      const [user, student] = await prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email,
            firstName,
            lastName,
            role:
              allowedCurrentRolesForCustomRole.includes(currentUser.role) &&
              currentUser.role !== "COURSE_REP"
                ? userRole
                : "STUDENT",
            passwordHash: hashedPassword,
          },
        });

        const student = await prisma.student.create({
          data: {
            id: user.id,
            matricNumber,
            departmentId,
            level,
            phone,
          },
        });

        return [user, student];
      });

      return { ...student, ...user } as Student;
    } catch (error) {
      // 4. Rollback Clerk user if Prisma creation failed
      if (clerkId) {
        try {
          await clerkClient.users.deleteUser(clerkId);
        } catch (rollbackError) {
          console.error("Failed to rollback Clerk user:", rollbackError);
        }
      }

      throw error; // rethrow so the controller can handle it
    }
  },
};
