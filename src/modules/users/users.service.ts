import bcrypt from 'bcrypt';
import { pool } from '../../db/pool';
import type { UpdateUserInput } from './users.types';

const SALT_ROUNDS = 10;

export async function getAllUsers() {
  const result = await pool.query(
    'SELECT id, name, email, phone, role FROM users ORDER BY id'
  );
  return result.rows;
}

export async function getUserById(userId: number) {
  const result = await pool.query(
    'SELECT id, name, email, phone, role FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function getFullUserById(userId: number) {
  const result = await pool.query(
    'SELECT id, name, email, password, phone, role FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function updateUser(userId: number, input: UpdateUserInput, isAdmin: boolean) {
  const existing = await getFullUserById(userId);
  if (!existing) return null;

  const name = input.name !== undefined ? input.name.trim() : existing.name;
  const email = input.email !== undefined ? input.email.trim().toLowerCase() : existing.email;
  const phone = input.phone !== undefined ? input.phone.trim() : existing.phone;
  let role = existing.role;
  if (isAdmin && input.role !== undefined && (input.role === 'admin' || input.role === 'customer')) {
    role = input.role;
  }

  if (!name) throw new Error('name cannot be empty');
  if (!email) throw new Error('email cannot be empty');
  if (!phone) throw new Error('phone cannot be empty');

  let password = existing.password;
  if (input.password !== undefined && input.password !== '') {
    if (input.password.length < 6) throw new Error('Password must be at least 6 characters');
    password = await bcrypt.hash(input.password, SALT_ROUNDS);
  }

  const result = await pool.query(
    `UPDATE users SET name = $1, email = $2, phone = $3, role = $4, password = $5
     WHERE id = $6
     RETURNING id, name, email, phone, role`,
    [name, email, phone, role, password, userId]
  );
  return result.rows[0];
}

export async function deleteUser(userId: number) {
  const existing = await getUserById(userId);
  if (!existing) return false;

  const activeBookings = await pool.query(
    "SELECT id FROM bookings WHERE customer_id = $1 AND status = 'active'",
    [userId]
  );
  if (activeBookings.rows.length > 0) {
    throw new Error('Cannot delete user with active bookings');
  }

  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  return true;
}
