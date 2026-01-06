export class AppError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    error: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
