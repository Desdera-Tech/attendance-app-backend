import { Student } from "../entities/Student";

export interface StudentsList {
  students: Student[];
  nextCursor: string | null;
}
