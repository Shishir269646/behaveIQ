import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { sendResponse } from '../utils/responseHandler';
import AppError from '../utils/AppError';
import * as userService from '../services/userService';
import { AuthenticatedRequest } from '../types';

/**
 * Get all users
 */
export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // A senior developer would consider if only admins or specific roles can get all users.
    // For now, assuming current user has permission or it's handled by middleware before this.
    const users = await userService.getAllUsers();
    sendResponse(res, 200, { users, count: users.length });
});

/**
 * Get single user
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await userService.getUserById(id);
    sendResponse(res, 200, { user });
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const updatedUser = await userService.updateUser(id, req.body);
    sendResponse(res, 200, { user: updatedUser });
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await userService.deleteUser(id);
    sendResponse(res, 200, {}, result.message);
});
