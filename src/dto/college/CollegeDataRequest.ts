import z from "zod";
import { requiredString } from "../../core/utils/validation";

export const collegeDataRequest = z.object({
  name: requiredString.min(
    3,
    "College name must be at least 3 characters long"
  ),
});

export type CollegeDataRequest = z.infer<typeof collegeDataRequest>;
