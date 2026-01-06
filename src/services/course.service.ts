import { HttpError } from "../core/errors/HttpError";
import { ApiResponse } from "../dto/ApiRespnse";
import { CourseDataRequest } from "../dto/course/CourseDataRequest";
import { Course } from "../entities/Course";
import { prisma } from "../lib/prisma";

export class CourseService {
  async createCourse(
    data: CourseDataRequest,
    schoolId: string
  ): Promise<ApiResponse<Course>> {
    const { code, title } = data;

    if (await prisma.course.findFirst({ where: { code } })) {
      throw new HttpError(409, "A course with this code already exists");
    }

    const course = await prisma.course.create({
      data: {
        code,
        title,
        schoolId,
      },
    });

    return {
      data: { ...course },
      message: "Course created successfully",
    };
  }

  async getCourseById(id: string): Promise<ApiResponse<Course>> {
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new HttpError(404, "Course not found");
    }

    return {
      data: { ...course },
      message: "Course fetched successfully",
    };
  }

  async getCourseByCode(
    code: string,
    schoolId: string
  ): Promise<ApiResponse<Course>> {
    const course = await prisma.course.findUnique({
      where: { code_schoolId: { code, schoolId } },
    });

    if (!course) {
      throw new HttpError(404, "Course not found");
    }

    return {
      data: { ...course },
      message: "Course fetched successfully",
    };
  }

  async updateCourse(
    id: string,
    data: CourseDataRequest
  ): Promise<ApiResponse<Course>> {
    const { code, title } = data;

    const { data: courseData } = await this.getCourseById(id);
    if (!courseData) throw new HttpError(404, "Course not found");

    const { schoolId } = courseData;

    if (await this.getCourseByCode(code, schoolId)) {
      throw new HttpError(409, "A course with this code already exists");
    }

    const course = await prisma.course.update({
      where: { id },
      data: { code, title },
    });

    return {
      data: { ...course },
      message: "Course updated successfully",
    };
  }

  async deleteCourse(id: string): Promise<ApiResponse<null>> {
    if (!(await prisma.course.findUnique({ where: { id } }))) {
      throw new HttpError(404, "Course not found");
    }

    await prisma.course.delete({ where: { id } });

    return { message: "Course deleted successfully" };
  }
}

export const courseService = new CourseService();
