import { Request, Response, NextFunction } from 'express';

export interface Pagination { page: number; limit: number; offset: number }

export default function pagination(req: Request, _res: Response, next: NextFunction) {
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '10', 10)));
  const offset = (page - 1) * limit;
  (req as any).pagination = { page, limit, offset } as Pagination;
  next();
}
