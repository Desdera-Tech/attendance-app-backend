import { requiredString } from "../../../utils/validation.ts";
import { z } from "zod";

export const createStudentRequest = z.object({
  matricNumber: requiredString
    .length(12, "Matric number must be 12 characters long")
    .regex(/^\d{12}$/, "Matric number must contain only numbers"),
  firstName: requiredString.min(
    3,
    "First name must be at least 3 characters long"
  ),
  lastName: requiredString.min(
    3,
    "Last name must be at least 3 characters long"
  ),
  email: z.email("Invalid email address"),
  phone: requiredString.min(10).max(15),
  departmentId: requiredString,
  level: requiredString,
  role: requiredString,
  password: requiredString.min(
    8,
    "Password must be at least 8 characters long"
  ),
});

export type CreateStudentRequest = z.infer<typeof createStudentRequest>;
