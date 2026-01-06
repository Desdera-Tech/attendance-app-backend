import { AppError } from "./AppError";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", error = "UNAUTHORIZED") {
    super(401, error, message);
  }
}
