import { ApiResponse } from "../dto/ApiRespnse";
import { CollegeDataRequest } from "../dto/college/CollegeDataRequest";
import { DepartmentsList } from "../dto/DepartmentsList";
import { StudentsList } from "../dto/StudentsList";
import { College } from "../entities/College";
import { Department } from "../entities/Department";
import { Student } from "../entities/Student";
import { prisma } from "../lib/prisma";
import { PAGE_SIZE } from "../core/utils/constants";
import { HttpError } from "../core/errors/HttpError";
import { schoolService } from "./school.service";

export class CollegeService {
  async existsById(id: string) {
    if (await prisma.college.findUnique({ where: { id } })) {
      return true;
    }
    return false;
  }

  async existsByName(name: string, schoolId: string) {
    if (
      await prisma.college.findUnique({
        where: { name_schoolId: { name, schoolId } },
      })
    ) {
      return true;
    }
    return false;
  }

  async createCollege(
    data: CollegeDataRequest,
    schoolId: string
  ): Promise<ApiResponse<College>> {
    const { name } = data;

    if (!(await schoolService.existsById(schoolId))) {
      throw new HttpError(404, "School doesn't exist");
    }

    if (await this.existsByName(name, schoolId)) {
      throw new HttpError(
        409,
        "A college with this name already exists in this school"
      );
    }

    const college = await prisma.college.create({
      data: { name, schoolId },
    });

    return {
      data: {
        ...college,
        students: 0,
        departments: 0,
      },
      message: "College created successfully",
    };
  }

  async updateCollege(
    data: CollegeDataRequest,
    collegeId: string
  ): Promise<ApiResponse<College>> {
    const { name } = data;

    const { data: collegeData } = await this.getCollege(collegeId);
    if (!collegeData) throw new HttpError(404, "College not found");

    const { schoolId } = collegeData;

    if (await schoolService.existsById(schoolId)) {
      throw new HttpError(404, "School not found");
    }

    if (await this.existsByName(name, schoolId)) {
      throw new HttpError(
        409,
        "A college with this name already exists in this school"
      );
    }

    const college = await prisma.college.update({
      where: { id: collegeId },
      data: { name },
      include: {
        departments: {
          select: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    const departmentStudents = college.departments.map(
      (department) => department._count.students
    );
    let studentsSum = 0;
    for (let i = 0; i < departmentStudents.length; i++) {
      studentsSum += departmentStudents[i];
    }

    return {
      data: {
        ...college,
        students: studentsSum,
        departments: college._count.departments,
      },
      message: "College updated successfully",
    };
  }

  async deleteCollege(id: string): Promise<ApiResponse<any>> {
    if (!(await this.existsById(id))) {
      throw new HttpError(404, "College not found!");
    }

    await prisma.college.delete({ where: { id } });

    return {
      message: "College deleted successfully",
    };
  }

  async getCollege(id: string): Promise<ApiResponse<College>> {
    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        departments: {
          select: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: { departments: true },
        },
      },
    });

    if (!college) {
      throw new HttpError(404, "College not found!");
    }

    const departmentStudents = college.departments.map(
      (department) => department._count.students
    );
    let studentsSum = 0;
    for (let i = 0; i < departmentStudents.length; i++) {
      studentsSum += departmentStudents[i];
    }

    return {
      data: {
        id: college.id,
        schoolId: college.schoolId,
        name: college.name,
        students: studentsSum,
        departments: college._count.departments,
        createdAt: college.createdAt,
      },
      message: "College fetched successfully",
    };
  }

  async getCollegeDepartments(
    collegeId: string,
    cursor: string
  ): Promise<ApiResponse<DepartmentsList>> {
    const pageSize = PAGE_SIZE;

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!college) {
      throw new HttpError(404, "College not found!");
    }

    const departments = await prisma.department.findMany({
      where: { collegeId },
      include: {
        college: {
          select: { name: true },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor =
      departments.length > pageSize ? departments[pageSize].id : null;

    const departmentsList: Department[] = departments.map((department) => ({
      id: department.id,
      collegeId: department.collegeId,
      name: department.name,
      collegeName: department.college.name,
      students: department._count.students,
      createdAt: department.createdAt,
    }));

    return {
      data: {
        departments: departmentsList.slice(0, pageSize),
        nextCursor,
      },
      message: "Departments fetched successfully!",
    };
  }

  async getCollegeStudents(
    collegeId: string,
    cursor: string
  ): Promise<ApiResponse<StudentsList>> {
    const pageSize = PAGE_SIZE;

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
    });

    if (!college) {
      throw new HttpError(404, "College not found!");
    }

    const students = await prisma.student.findMany({
      where: { department: { collegeId } },
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

export const collegeService = new CollegeService();
