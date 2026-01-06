import { AppError } from "./AppError";

export class HttpError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    error?: string,
    details?: unknown
  ) {
    super(
      statusCode,
      error ?? HttpError.defaultError(statusCode),
      message,
      details
    );
  }

  private static defaultError(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return "BAD_REQUEST";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "UNPROCESSABLE_ENTITY";
      default:
        return "HTTP_ERROR";
    }
  }
}
