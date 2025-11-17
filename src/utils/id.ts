import { randomBytes } from 'crypto';

export function generateId(prefix: string = ''): string {
  const randomPart = randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}

export function generateProjectId(): string {
  return generateId('proj');
}

export function generateVideoId(): string {
  return generateId('vid');
}
