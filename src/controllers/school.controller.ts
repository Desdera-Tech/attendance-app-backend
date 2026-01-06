import { Request, Response } from "express";
import { asyncHandler } from "../core/utils/asyncHandler";
import { schoolDataRequest } from "../dto/school/request/SchoolDataRequest";
import { schoolService } from "../services/school.service";

export const createSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const data = schoolDataRequest.parse(req.body);
    const response = await schoolService.createSchool(data);
    res.status(201).json(response);
  }
);

export const editSchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  const data = schoolDataRequest.parse(req.body);
  const response = await schoolService.editSchool(data, schoolId);
  res.status(200).json(response);
});

export const getSchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const response = await schoolService.getSchool(schoolId);
  res.status(200).json(response);
});
