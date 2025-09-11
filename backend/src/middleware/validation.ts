import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { passwordSchema } from '../validators/password.js';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }
      next(error);
    }
  };
};

// Example Schema
export const createScreenplaySchema = z.object({
  body: z.object({
    title: z.string().min(1, { message: "Title is required" }).max(255),
    // Assuming userId will be extracted from authenticated user, not from body
  }),
});

export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(20),
    password: passwordSchema,
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});
