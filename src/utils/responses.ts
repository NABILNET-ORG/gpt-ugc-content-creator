import { Response } from 'express';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  errorCode: string;
  message: string;
  details?: any;
}

export function sendSuccess<T>(res: Response, data: T): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  res.json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  errorCode: string,
  message: string,
  details?: any
): void {
  const response: ErrorResponse = {
    success: false,
    errorCode,
    message,
    ...(details && { details }),
  };
  res.status(statusCode).json(response);
}
