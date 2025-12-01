import { Role } from "../generated/prisma/enums.ts";

export interface Admin {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  role: Role;
  createdAt: Date;
}
