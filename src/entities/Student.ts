import { User } from "./User.ts";

export interface Student extends User {
  phone: string;
  level: string;
  matricNumber: string;
}
