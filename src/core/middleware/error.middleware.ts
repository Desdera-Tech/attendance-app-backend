import { Request, Response, NextFunction } from "express";
import { mapToApiException } from "../errors/mapToApiException";
import { AppError } from "../errors/AppError";

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (!(err instanceof AppError)) {
    console.warn("Unmapped error thrown:", err);
  }

  const apiError = mapToApiException(err);

  const enrichedError = {
    ...apiError,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  if (apiError.statusCode === 500) {
    console.error({
      error: err,
      path: req.originalUrl,
      method: req.method,
    });
  }

  res.status(apiError.statusCode).json(enrichedError);
};
