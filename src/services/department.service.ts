import { ApiResponse } from "../dto/ApiRespnse";
import { DepartmentDataRequest } from "../dto/department/DepartmentDataRequest";
import { StudentsList } from "../dto/StudentsList";
import { Department } from "../entities/Department";
import { Student } from "../entities/Student";
import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "../core/utils/constants";
import { HttpError } from "../core/errors/HttpError";
import { collegeService } from "./college.service";

export class DepartmentService {
  async existsById(id: string) {
    if (await prisma.department.findUnique({ where: { id } })) {
      return true;
    }
    return false;
  }

  async existsByName(name: string, collegeId: string) {
    const { data } = await collegeService.getCollege(collegeId);
    if (!data) {
      throw new HttpError(404, "College not found");
    }

    const { schoolId } = data;

    if (
      await prisma.department.findUnique({
        where: { name_collegeId_schoolId: { name, collegeId, schoolId } },
      })
    ) {
      return true;
    }
    return false;
  }

  async createDepartment(
    collegeId: string,
    data: DepartmentDataRequest
  ): Promise<ApiResponse<Department>> {
    const { name } = data;

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!college) {
      throw new HttpError(404, "College not found");
    }

    if (await this.existsByName(name, collegeId)) {
      throw new HttpError(
        409,
        "A department with this name already exists in this college"
      );
    }

    const department = await prisma.department.create({
      data: { collegeId, name, schoolId: college.schoolId },
    });

    return {
      data: {
        ...department,
        collegeName: college.name,
        students: 0,
      },
      message: "Department created successfully",
    };
  }

  async getDepartment(
    id: string,
    collegeId: string
  ): Promise<ApiResponse<Department>> {
    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!college) {
      throw new HttpError(404, "College not found");
    }

    const department = await prisma.department.findUnique({
      where: { id, collegeId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!department) {
      throw new HttpError(404, "Department not found");
    }

    return {
      data: {
        ...department,
        collegeName: college.name,
        students: department._count.students,
      },
      message: "Department fetched successfully",
    };
  }

  async updateDepartment(
    collegeId: string,
    departmentId: string,
    data: DepartmentDataRequest
  ): Promise<ApiResponse<Department>> {
    const { name } = data;

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!college) {
      throw new HttpError(404, "College not found");
    }

    if (!(await this.existsById(departmentId))) {
      throw new HttpError(404, "Department not found");
    }

    if (await this.existsByName(name, collegeId)) {
      throw new HttpError(
        409,
        "A department with this name already exists in this college"
      );
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: { name },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return {
      data: {
        ...department,
        collegeName: college.name,
        students: department._count.students,
      },
      message: "Department updated successfully",
    };
  }

  async deleteDepartment(
    departmentId: string,
    collegeId: string
  ): Promise<ApiResponse<null>> {
    if (!(await departmentService.existsById(collegeId))) {
      throw new HttpError(404, "Department not found");
    }

    if (!(await this.existsById(departmentId))) {
      throw new HttpError(404, "Department not found");
    }

    await prisma.department.delete({ where: { id: departmentId, collegeId } });

    return {
      message: "Department deleted successfully",
    };
  }

  async getDepartmentStudents(
    id: string,
    collegeId: string,
    cursor: string
  ): Promise<ApiResponse<StudentsList>> {
    const pageSize = PAGE_SIZE;

    if (!(await this.existsById(id))) {
      throw new HttpError(404, "Department not found");
    }

    const students = await prisma.student.findMany({
      where: { departmentId: id },
      include: {
        user: true,
        department: {
          select: { name: true, college: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor =
      students.length > pageSize ? students[pageSize].id : null;

    const studentsList: Student[] = students.map((student) => ({
      ...student.user,
      ...student,
      collegeId,
      departmentId: student.departmentId,
      collegeName: student.department.college.name,
      departmentName: student.department.name,
    }));

    return {
      data: {
        students: studentsList.slice(0, pageSize),
        nextCursor,
      },
      message: "Students fetched successfully!",
    };
  }
}

export const departmentService = new DepartmentService();
