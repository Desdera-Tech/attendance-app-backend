export interface School {
  name: string;
  image: string | null;
  canStudentCreateSession: boolean;
  students: number;
  lecturers: number;
  courses: number;
  departments: number;
  colleges: number;
}
