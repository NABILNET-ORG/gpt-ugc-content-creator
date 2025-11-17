import { Request, Response, NextFunction } from 'express';
import { env } from './env';
import { sendError } from '../utils/responses';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-gpt-backend-secret'];

  if (!secret || secret !== env.GPT_BACKEND_SECRET) {
    sendError(res, 401, 'UNAUTHORIZED', 'Unauthorized');
    return;
  }

  next();
}
