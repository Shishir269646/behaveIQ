import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendSuccess } from '../utils/responseHandler';
import * as authService from '../services/authService';
import { AuthenticatedRequest } from '../types';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendSuccess(res, result, 'User logged in successfully');
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getUserProfile(req.user.id);
  sendSuccess(res, { user }, 'User profile retrieved');
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, null, 'Logged out successfully');
});
