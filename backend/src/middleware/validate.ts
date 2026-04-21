import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '../utils/AppError';

/**
 * Higher-order middleware to validate request using Zod
 */
export const validate = (schema: AnyZodObject) => 
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assigning parsed data back to req to ensure type safety in controllers
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new BadRequestError(`Validation Failed: ${details}`));
      }
      return next(error);
    }
  };
