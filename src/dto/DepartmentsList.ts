import { Department } from "../entities/Department";

export interface DepartmentsList {
  departments: Department[];
  nextCursor: string | null;
}
