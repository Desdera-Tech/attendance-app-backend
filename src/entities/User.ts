import { Role } from "../generated/prisma/enums.ts";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  profilePhoto: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
}
