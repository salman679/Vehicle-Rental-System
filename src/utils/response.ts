import { Response } from 'express';

export function successRes(res: Response, status: number, message: string, data?: unknown): void {
  if (data === undefined) {
    res.status(status).json({ success: true, message });
  } else {
    res.status(status).json({ success: true, message, data });
  }
}

export function errorRes(res: Response, status: number, message: string, errors?: string): void {
  res.status(status).json({ success: false, message, errors: errors ?? message });
}
