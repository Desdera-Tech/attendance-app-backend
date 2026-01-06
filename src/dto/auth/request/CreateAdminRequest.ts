import { requiredString } from "../../../core/utils/validation.ts";
import { z } from "zod";

export const createAdminRequest = z.object({
  name: requiredString.min(3, "Name must be at least 3 characters long"),
  email: z.email("Invalid email address"),
  password: requiredString.min(
    8,
    "Password must be at least 8 characters long"
  ),
});

export type CreateAdminRequest = z.infer<typeof createAdminRequest>;
