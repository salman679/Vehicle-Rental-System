import { UserRole } from '../../types';

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
}
