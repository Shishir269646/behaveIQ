import { Response } from 'express';

/**
 * Standard API Response structure
 */
interface ApiResponse<T = any> {
  success: true;
  message?: string;
  data: T;
  meta?: {
    count?: number;
    [key: string]: any;
  };
}

/**
 * Sends a successful API response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: any
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  res.status(statusCode).json(response);
};
