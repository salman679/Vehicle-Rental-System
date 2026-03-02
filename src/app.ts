import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import vehiclesRoutes from './modules/vehicles/vehicles.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';

const app = express();

app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/bookings', bookingsRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    errors: 'The requested resource or endpoint does not exist',
  });
});

app.use(errorHandler);

export default app;
