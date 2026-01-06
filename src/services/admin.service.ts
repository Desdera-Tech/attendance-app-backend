import { prisma } from "../lib/prisma";

export class AdminService {
  async existsByEmail(email: string) {
    if (await prisma.admin.findUnique({ where: { email } })) {
      return true;
    }
    return false;
  }
}

export const adminService = new AdminService();
