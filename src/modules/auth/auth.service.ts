import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool';
import { config } from '../../config';
import type { SignupInput, SigninInput } from './auth.types';

const SALT_ROUNDS = 10;

export async function signup(input: SignupInput) {
  const emailLower = input.email.trim().toLowerCase();
  if (input.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  const role = input.role && ['admin', 'customer'].includes(input.role) ? input.role : 'customer';
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role`,
    [input.name.trim(), emailLower, hashedPassword, input.phone.trim(), role]
  );
  return result.rows[0];
}

export async function signin(input: SigninInput) {
  const emailLower = input.email.trim().toLowerCase();
  const result = await pool.query(
    'SELECT id, name, email, password, phone, role FROM users WHERE LOWER(email) = $1',
    [emailLower]
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error('Invalid email or password');
  }
  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new Error('Invalid email or password');
  }
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
}
