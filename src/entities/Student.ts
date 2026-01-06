import { User } from "./User.ts";

export interface Student extends User {
  collegeId: string;
  departmentId: string;
  collegeName: string;
  departmentName: string;
  phone: string;
  level: string;
  matricNumber: string;
}
