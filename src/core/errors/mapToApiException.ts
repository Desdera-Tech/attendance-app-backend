import { ApiException } from "./ApiException";
import { AppError } from "./AppError";

export const mapToApiException = (err: unknown): ApiException => {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      error: err.error,
      message: err.message,
      details: err.details,
    };
  }

  if (err instanceof Error) {
    return {
      statusCode: 500,
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    };
  }

  // Truly unknown (non-error throw)
  return {
    statusCode: 500,
    error: "INTERNAL_SERVER_ERROR",
    message: "Unknown failure",
  };
};
