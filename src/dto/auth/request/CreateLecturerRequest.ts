import { requiredString } from "../../../utils/validation.ts";
import { z } from "zod";

export const createLecturerRequest = z.object({
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
  password: requiredString.min(
    8,
    "Password must be at least 8 characters long"
  ),
});

export type CreateLecturerRequest = z.infer<typeof createLecturerRequest>;
