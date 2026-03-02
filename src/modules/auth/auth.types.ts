import { UserRole } from '../../types';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

export interface SigninInput {
  email: string;
  password: string;
}
