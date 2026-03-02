import { Request, Response } from 'express';
import * as usersService from './users.service';
import { successRes, errorRes } from '../../utils/response';

export async function getAllUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await usersService.getAllUsers();
    successRes(res, 200, 'Users retrieved successfully', users);
  } catch {
    errorRes(res, 500, 'Failed to retrieve users', 'Internal error');
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      errorRes(res, 400, 'Invalid user ID', 'userId must be a number');
      return;
    }
    const existing = await usersService.getUserById(userId);
    if (!existing) {
      errorRes(res, 404, 'User not found', 'User not found');
      return;
    }
    const isAdmin = req.user?.role === 'admin';
    const body = req.body;
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.password !== undefined) updates.password = body.password;
    if (isAdmin && body.role !== undefined) updates.role = body.role;

    const user = await usersService.updateUser(userId, updates as Parameters<typeof usersService.updateUser>[1], isAdmin);
    if (!user) {
      errorRes(res, 404, 'User not found', 'User not found');
      return;
    }
    successRes(res, 200, 'User updated successfully', user);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    if (message.includes('duplicate') || message.includes('unique') || message.includes('email')) {
      errorRes(res, 400, 'Validation failed', 'Email already in use');
      return;
    }
    if (message.includes('Password')) {
      errorRes(res, 400, 'Validation failed', message);
      return;
    }
    errorRes(res, 400, 'Validation failed', message);
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      errorRes(res, 400, 'Invalid user ID', 'userId must be a number');
      return;
    }
    const existing = await usersService.getUserById(userId);
    if (!existing) {
      errorRes(res, 404, 'User not found', 'User not found');
      return;
    }
    await usersService.deleteUser(userId);
    successRes(res, 200, 'User deleted successfully', undefined);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete user';
    if (message.includes('active bookings')) {
      errorRes(res, 400, 'Cannot delete user', message);
      return;
    }
    errorRes(res, 500, 'Failed to delete user', message);
  }
}
