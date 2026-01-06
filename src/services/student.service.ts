import { prisma } from "../lib/prisma";

export class StudentService {
  async existsByMatricNumber(matricNumber: string, schoolId: string) {
    if (
      await prisma.student.findUnique({
        where: { matricNumber_schoolId: { matricNumber, schoolId } },
      })
    ) {
      return true;
    }
    return false;
  }
}

export const studentService = new StudentService();
