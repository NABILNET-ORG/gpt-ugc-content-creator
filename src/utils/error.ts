export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createAppError(
  statusCode: number,
  errorCode: string,
  message: string,
  details?: any
): AppError {
  return new AppError(statusCode, errorCode, message, details);
}
