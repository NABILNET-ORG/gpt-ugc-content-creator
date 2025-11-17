import { AppError } from './error';

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} is required`);
  }
}

export function validateUrl(value: string, fieldName: string): void {
  try {
    new URL(value);
  } catch {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid URL`);
  }
}

export function validateEmail(value: string, fieldName: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid email`);
  }
}

export function validateEnum<T>(
  value: T,
  allowedValues: T[],
  fieldName: string
): void {
  if (!allowedValues.includes(value)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
}
