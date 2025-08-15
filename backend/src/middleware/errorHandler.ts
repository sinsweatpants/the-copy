import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  console.error('ERROR 💥', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Handle Zod errors if they reach here (though validation middleware should catch them)
  if (err.name === 'ZodError') {
      return res.status(400).json({
          error: 'Validation failed',
          details: err.message,
      });
  }

  res.status(500).json({
    error: 'An unexpected error occurred. Please try again later.',
  });
};
