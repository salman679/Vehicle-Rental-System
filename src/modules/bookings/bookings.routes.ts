import { Router } from 'express';
import { authenticate, requireCustomerOrAdmin } from '../../middleware/auth';
import * as bookingsController from './bookings.controller';

const router = Router();

router.post('/', authenticate, requireCustomerOrAdmin, bookingsController.createBooking);
router.get('/', authenticate, requireCustomerOrAdmin, bookingsController.getAllBookings);
router.put('/:bookingId', authenticate, requireCustomerOrAdmin, bookingsController.updateBooking);

export default router;
