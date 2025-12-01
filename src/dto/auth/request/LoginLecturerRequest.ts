import { requiredString } from "../../../utils/validation.ts";
import { z } from "zod";

export const loginLecturerRequest = z.object({
  email: z.email("Invalid email address"),
  password: requiredString.min(
    6,
    "Password must be at least 6 characters long"
  ),
});

export type LoginLecturerRequest = z.infer<typeof loginLecturerRequest>;
