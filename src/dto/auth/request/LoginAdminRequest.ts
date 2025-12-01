import { requiredString } from "../../../utils/validation.ts";
import { z } from "zod";

export const loginAdminRequest = z.object({
  email: z.email("Invalid email address"),
  password: requiredString.min(
    6,
    "Password must be at least 6 characters long"
  ),
});

export type LoginAdminRequest = z.infer<typeof loginAdminRequest>;
