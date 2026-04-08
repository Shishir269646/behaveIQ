import { Response } from 'express';

interface ResponseBody {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Sends a standard API response.
 */
export const sendResponse = (
  res: Response,
  statusCode: number,
  data: any = null,
  message: string | null = null
): void => {
  const response: ResponseBody = {
    success: statusCode >= 200 && statusCode < 300,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};
