import { Request, Response } from 'express';
import * as authService from './auth.service';
import { successRes, errorRes } from '../../utils/response';

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password || !phone) {
      errorRes(res, 400, 'Validation failed', 'name, email, password and phone are required');
      return;
    }
    const user = await authService.signup({ name, email, password, phone, role });
    successRes(res, 201, 'User registered successfully', user);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    if (message.includes('duplicate') || message.includes('unique') || message.includes('email')) {
      errorRes(res, 400, 'Registration failed', 'Email already registered');
      return;
    }
    if (message.includes('Password')) {
      errorRes(res, 400, 'Validation failed', message);
      return;
    }
    errorRes(res, 500, 'Registration failed', message);
  }
}

export async function signin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      errorRes(res, 400, 'Validation failed', 'email and password are required');
      return;
    }
    const data = await authService.signin({ email, password });
    successRes(res, 200, 'Login successful', data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    if (message.includes('Invalid email or password')) {
      errorRes(res, 401, 'Login failed', message);
      return;
    }
    errorRes(res, 500, 'Login failed', message);
  }
}
