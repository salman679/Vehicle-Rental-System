import { Request, Response } from 'express';
import * as bookingsService from './bookings.service';
import { successRes, errorRes } from '../../utils/response';

export async function createBooking(req: Request, res: Response): Promise<void> {
  try {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } = req.body;
    if (customer_id == null || vehicle_id == null || !rent_start_date || !rent_end_date) {
      errorRes(res, 400, 'Validation failed', 'customer_id, vehicle_id, rent_start_date and rent_end_date are required');
      return;
    }
    const data = await bookingsService.createBooking({
      customer_id: Number(customer_id),
      vehicle_id: Number(vehicle_id),
      rent_start_date,
      rent_end_date,
    });
    successRes(res, 201, 'Booking created successfully', data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create booking';
    if (message.includes('not found') || message.includes('not available') || message.includes('Invalid date')) {
      errorRes(res, 400, 'Validation failed', message);
      return;
    }
    errorRes(res, 500, 'Failed to create booking', message);
  }
}

export async function getAllBookings(req: Request, res: Response): Promise<void> {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!role || userId == null) {
      errorRes(res, 401, 'Unauthorized', 'Authentication required');
      return;
    }
    if (role === 'admin') {
      const data = await bookingsService.getAllBookingsForAdmin();
      successRes(res, 200, 'Bookings retrieved successfully', data);
    } else {
      const data = await bookingsService.getBookingsForCustomer(userId);
      successRes(res, 200, 'Your bookings retrieved successfully', data);
    }
  } catch {
    errorRes(res, 500, 'Failed to retrieve bookings', 'Internal error');
  }
}

export async function updateBooking(req: Request, res: Response): Promise<void> {
  try {
    const bookingId = parseInt(req.params.bookingId ?? '0', 10);
    if (isNaN(bookingId)) {
      errorRes(res, 400, 'Invalid booking ID', 'bookingId must be a number');
      return;
    }
    const { status } = req.body;
    if (!status || !['cancelled', 'returned'].includes(status)) {
      errorRes(res, 400, 'Validation failed', 'status must be cancelled or returned');
      return;
    }
    const userId = req.user?.userId ?? 0;
    const role = req.user?.role ?? 'customer';
    const data = await bookingsService.updateBooking(bookingId, status, userId, role);
    if (!data) {
      errorRes(res, 404, 'Booking not found', 'Booking not found');
      return;
    }
    const message =
      status === 'cancelled'
        ? 'Booking cancelled successfully'
        : 'Booking marked as returned. Vehicle is now available';
    successRes(res, 200, message, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update booking';
    if (message.includes('Forbidden') || message.includes('after start date') || message.includes('Only admin')) {
      errorRes(res, 403, 'Forbidden', message);
      return;
    }
    if (message.includes('Only active')) {
      errorRes(res, 400, 'Validation failed', message);
      return;
    }
    errorRes(res, 500, 'Failed to update booking', message);
  }
}
