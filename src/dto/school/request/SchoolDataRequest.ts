import z from "zod";
import { requiredString } from "../../../core/utils/validation";

export const schoolDataRequest = z.object({
  name: requiredString.min(3, "School name must be at least 3 characters long"),
  image: z.string().trim(),
  canStudentCreateSession: z.boolean(),
});

export type SchoolDataRequest = z.infer<typeof schoolDataRequest>;
