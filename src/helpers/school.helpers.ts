import { Prisma } from "../generated/prisma/client";

export function getSchoolAnalyticsData() {
  return {
    _count: {
      select: {
        students: true,
        lecturers: true,
        courses: true,
        departments: true,
        colleges: true,
      },
    },
  } satisfies Prisma.SchoolInclude;
}
