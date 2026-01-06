import z from "zod";
import { requiredString } from "../../core/utils/validation";

export const departmentDataRequest = z.object({
  name: requiredString.min(
    3,
    "Department name must be at least 3 characters long"
  ),
});

export type DepartmentDataRequest = z.infer<typeof departmentDataRequest>;
