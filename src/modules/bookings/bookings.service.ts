import { pool } from '../../db/pool';
import { BookingStatus } from '../../types';
import type { CreateBookingInput } from './bookings.types';

function parseDate(s: string): Date {
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error('Invalid date format');
  return d;
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  const diff = b.getTime() - a.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function autoMarkExpiredBookingsReturned(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const result = await pool.query(
    "SELECT id, vehicle_id FROM bookings WHERE status = 'active' AND rent_end_date < $1",
    [today]
  );
  for (const row of result.rows) {
    await pool.query("UPDATE bookings SET status = 'returned' WHERE id = $1", [row.id]);
    await pool.query("UPDATE vehicles SET availability_status = 'available' WHERE id = $1", [row.vehicle_id]);
  }
}

export async function createBooking(input: CreateBookingInput) {
  const start = input.rent_start_date;
  const end = input.rent_end_date;
  if (!start || !end) throw new Error('rent_start_date and rent_end_date are required');

  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (endDate <= startDate) throw new Error('rent_end_date must be after rent_start_date');

  const vehicleResult = await pool.query(
    'SELECT id, vehicle_name, daily_rent_price, availability_status FROM vehicles WHERE id = $1',
    [input.vehicle_id]
  );
  const vehicle = vehicleResult.rows[0];
  if (!vehicle) throw new Error('Vehicle not found');
  if (vehicle.availability_status !== 'available') {
    throw new Error('Vehicle is not available for booking');
  }

  const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [input.customer_id]);
  if (!userResult.rows[0]) throw new Error('Customer not found');

  const numDays = daysBetween(start, end);
  const dailyPrice = parseFloat(vehicle.daily_rent_price);
  const total_price = numDays * dailyPrice;
  if (total_price <= 0) throw new Error('Invalid date range');

  const insertResult = await pool.query(
    `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
    [input.customer_id, input.vehicle_id, start, end, total_price]
  );
  await pool.query(
    "UPDATE vehicles SET availability_status = 'booked' WHERE id = $1",
    [input.vehicle_id]
  );
  const booking = insertResult.rows[0];
  return {
    ...booking,
    vehicle: {
      vehicle_name: vehicle.vehicle_name,
      daily_rent_price: dailyPrice,
    },
  };
}

export async function getAllBookingsForAdmin() {
  await autoMarkExpiredBookingsReturned();
  const result = await pool.query(
    `SELECT b.id, b.customer_id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
            u.name AS customer_name, u.email AS customer_email,
            v.vehicle_name, v.registration_number
     FROM bookings b
     JOIN users u ON b.customer_id = u.id
     JOIN vehicles v ON b.vehicle_id = v.id
     ORDER BY b.id`
  );
  return result.rows.map((row) => ({
    id: row.id,
    customer_id: row.customer_id,
    vehicle_id: row.vehicle_id,
    rent_start_date: row.rent_start_date,
    rent_end_date: row.rent_end_date,
    total_price: parseFloat(row.total_price),
    status: row.status,
    customer: { name: row.customer_name, email: row.customer_email },
    vehicle: { vehicle_name: row.vehicle_name, registration_number: row.registration_number },
  }));
}

export async function getBookingsForCustomer(customerId: number) {
  await autoMarkExpiredBookingsReturned();
  const result = await pool.query(
    `SELECT b.id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
            v.vehicle_name, v.registration_number, v.type
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     WHERE b.customer_id = $1
     ORDER BY b.id`,
    [customerId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    vehicle_id: row.vehicle_id,
    rent_start_date: row.rent_start_date,
    rent_end_date: row.rent_end_date,
    total_price: parseFloat(row.total_price),
    status: row.status,
    vehicle: {
      vehicle_name: row.vehicle_name,
      registration_number: row.registration_number,
      type: row.type,
    },
  }));
}

export async function getBookingById(bookingId: number) {
  const result = await pool.query(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId]
  );
  return result.rows[0] ?? null;
}

export async function updateBooking(
  bookingId: number,
  status: BookingStatus,
  userId: number,
  role: string
) {
  await autoMarkExpiredBookingsReturned();
  const booking = await getBookingById(bookingId);
  if (!booking) return null;

  const today = new Date().toISOString().slice(0, 10);

  if (status === 'cancelled') {
    if (role !== 'admin' && booking.customer_id !== userId) {
      throw new Error('Forbidden');
    }
    if (booking.rent_start_date <= today) {
      throw new Error('Cannot cancel booking after start date');
    }
    if (booking.status !== 'active') {
      throw new Error('Only active bookings can be cancelled');
    }
    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [bookingId]);
    await pool.query("UPDATE vehicles SET availability_status = 'available' WHERE id = $1", [booking.vehicle_id]);
    return {
      id: booking.id,
      customer_id: booking.customer_id,
      vehicle_id: booking.vehicle_id,
      rent_start_date: booking.rent_start_date,
      rent_end_date: booking.rent_end_date,
      total_price: parseFloat(booking.total_price),
      status: 'cancelled' as const,
    };
  }

  if (status === 'returned') {
    if (role !== 'admin') {
      throw new Error('Only admin can mark booking as returned');
    }
    if (booking.status !== 'active') {
      throw new Error('Only active bookings can be marked as returned');
    }
    await pool.query("UPDATE bookings SET status = 'returned' WHERE id = $1", [bookingId]);
    await pool.query("UPDATE vehicles SET availability_status = 'available' WHERE id = $1", [booking.vehicle_id]);
    const vehicleResult = await pool.query(
      'SELECT availability_status FROM vehicles WHERE id = $1',
      [booking.vehicle_id]
    );
    return {
      id: booking.id,
      customer_id: booking.customer_id,
      vehicle_id: booking.vehicle_id,
      rent_start_date: booking.rent_start_date,
      rent_end_date: booking.rent_end_date,
      total_price: parseFloat(booking.total_price),
      status: 'returned' as const,
      vehicle: { availability_status: vehicleResult.rows[0]?.availability_status ?? 'available' },
    };
  }

  throw new Error('Invalid status');
}
