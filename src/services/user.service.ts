import { prisma } from "../lib/prisma";

export class UserService {
  async existsByEmail(email: string, schoolId: string) {
    if (
      await prisma.user.findUnique({
        where: { email_schoolId: { email, schoolId } },
      })
    ) {
      return true;
    }
    return false;
  }

  async getUserById(userId: string) {}
}

export const userService = new UserService();
