import { requiredString } from "../../../core/utils/validation.ts";
import { z } from "zod";

export const loginStudentRequest = z.object({
  matricNumber: requiredString
    .length(12, "Matric number must be 12 characters long")
    .regex(/^\d{12}$/, "Matric number must contain only numbers"),
  password: requiredString.min(
    6,
    "Password must be at least 6 characters long"
  ),
});

export type LoginStudentRequest = z.infer<typeof loginStudentRequest>;
