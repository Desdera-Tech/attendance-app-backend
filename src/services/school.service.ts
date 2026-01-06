import { HttpError } from "../core/errors/HttpError";
import { ApiResponse } from "../dto/ApiRespnse";
import { SchoolDataRequest } from "../dto/school/request/SchoolDataRequest";
import { School } from "../entities/School";
import { getSchoolAnalyticsData } from "../helpers/school.helpers";
import { prisma } from "../lib/prisma";

export class SchoolService {
  async existsById(schoolId: string) {
    if (await prisma.school.findUnique({ where: { id: schoolId } })) {
      return true;
    }
    return false;
  }

  async existsByName(schoolName: string) {
    if (await prisma.school.findUnique({ where: { name: schoolName } })) {
      return true;
    }
    return false;
  }

  async createSchool(data: SchoolDataRequest): Promise<ApiResponse<School>> {
    const { name, image, canStudentCreateSession } = data;

    if (await this.existsByName(name)) {
      throw new HttpError(409, "A school with this name already exists");
    }

    const school = await prisma.school.create({
      data: {
        name,
        image,
        canStudentCreateSession,
      },
    });

    return {
      data: {
        ...school,
        students: 0,
        lecturers: 0,
        courses: 0,
        departments: 0,
        colleges: 0,
      },
      message: "School created successfully",
    };
  }

  async editSchool(
    data: SchoolDataRequest,
    schoolId: string
  ): Promise<ApiResponse<School>> {
    const { name, image, canStudentCreateSession } = data;

    if (!(await this.existsById(schoolId))) {
      throw new HttpError(404, "School not found");
    }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name,
        image,
        canStudentCreateSession,
      },
      include: getSchoolAnalyticsData(),
    });

    const existsByName = await this.existsByName(name);
    if (school.name !== name && existsByName) {
      throw new HttpError(409, "A school with this name already exists");
    }

    return {
      data: {
        ...school,
        students: school._count.students,
        lecturers: school._count.lecturers,
        courses: school._count.courses,
        departments: school._count.departments,
        colleges: school._count.colleges,
      },
      message: "School updated successfully",
    };
  }

  async getSchool(schoolId: string): Promise<ApiResponse<School>> {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: getSchoolAnalyticsData(),
    });

    if (!school) {
      throw new HttpError(404, "School not found");
    }

    return {
      data: {
        ...school,
        students: school._count.students,
        lecturers: school._count.lecturers,
        courses: school._count.courses,
        departments: school._count.departments,
        colleges: school._count.colleges,
      },
      message: "School fetched successfully",
    };
  }
}

export const schoolService = new SchoolService();
