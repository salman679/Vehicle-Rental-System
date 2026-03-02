import { pool } from '../../db/pool';
import { VehicleType, AvailabilityStatus } from '../../types';
import type { CreateVehicleInput, UpdateVehicleInput } from './vehicles.types';

const VALID_TYPES: VehicleType[] = ['car', 'bike', 'van', 'SUV'];
const VALID_STATUSES: AvailabilityStatus[] = ['available', 'booked'];

function validateType(type: string): type is VehicleType {
  return VALID_TYPES.includes(type as VehicleType);
}

function validateStatus(s: string): s is AvailabilityStatus {
  return VALID_STATUSES.includes(s as AvailabilityStatus);
}

export async function createVehicle(input: CreateVehicleInput) {
  if (!input.vehicle_name?.trim()) throw new Error('vehicle_name is required');
  if (!validateType(input.type)) throw new Error('type must be car, bike, van or SUV');
  if (!input.registration_number?.trim()) throw new Error('registration_number is required');
  if (typeof input.daily_rent_price !== 'number' || input.daily_rent_price <= 0) {
    throw new Error('daily_rent_price must be a positive number');
  }
  const status = input.availability_status && validateStatus(input.availability_status)
    ? input.availability_status
    : 'available';

  const result = await pool.query(
    `INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
    [input.vehicle_name.trim(), input.type, input.registration_number.trim(), input.daily_rent_price, status]
  );
  return result.rows[0];
}

export async function getAllVehicles() {
  const result = await pool.query(
    'SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles ORDER BY id'
  );
  return result.rows;
}

export async function getVehicleById(vehicleId: number) {
  const result = await pool.query(
    'SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles WHERE id = $1',
    [vehicleId]
  );
  return result.rows[0] ?? null;
}

export async function updateVehicle(vehicleId: number, input: UpdateVehicleInput) {
  const existing = await getVehicleById(vehicleId);
  if (!existing) return null;

  const vehicle_name = input.vehicle_name !== undefined ? input.vehicle_name.trim() : existing.vehicle_name;
  const type = input.type !== undefined ? input.type : existing.type;
  const registration_number = input.registration_number !== undefined ? input.registration_number.trim() : existing.registration_number;
  const daily_rent_price = input.daily_rent_price !== undefined ? input.daily_rent_price : existing.daily_rent_price;
  const availability_status = input.availability_status !== undefined ? input.availability_status : existing.availability_status;

  if (!vehicle_name) throw new Error('vehicle_name cannot be empty');
  if (!validateType(type)) throw new Error('type must be car, bike, van or SUV');
  if (!registration_number) throw new Error('registration_number cannot be empty');
  if (typeof daily_rent_price !== 'number' || daily_rent_price <= 0) {
    throw new Error('daily_rent_price must be a positive number');
  }
  if (!validateStatus(availability_status)) throw new Error('availability_status must be available or booked');

  const result = await pool.query(
    `UPDATE vehicles SET vehicle_name = $1, type = $2, registration_number = $3, daily_rent_price = $4, availability_status = $5
     WHERE id = $6
     RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status, vehicleId]
  );
  return result.rows[0];
}

export async function deleteVehicle(vehicleId: number) {
  const existing = await getVehicleById(vehicleId);
  if (!existing) return false;

  const activeBookings = await pool.query(
    "SELECT id FROM bookings WHERE vehicle_id = $1 AND status = 'active'",
    [vehicleId]
  );
  if (activeBookings.rows.length > 0) {
    throw new Error('Cannot delete vehicle with active bookings');
  }

  await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);
  return true;
}
