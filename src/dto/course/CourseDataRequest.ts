import z from "zod";
import { requiredString } from "../../core/utils/validation";

export const courseDataRequest = z.object({
  code: requiredString.min(3, "Course code must be at least 3 characters long"),
  title: requiredString.min(
    3,
    "Course title must be at least 3 characters long"
  ),
});

export type CourseDataRequest = z.infer<typeof courseDataRequest>;
