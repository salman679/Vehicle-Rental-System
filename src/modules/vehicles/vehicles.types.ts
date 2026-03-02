import { VehicleType, AvailabilityStatus } from '../../types';

export interface CreateVehicleInput {
  vehicle_name: string;
  type: VehicleType;
  registration_number: string;
  daily_rent_price: number;
  availability_status: AvailabilityStatus;
}

export interface UpdateVehicleInput {
  vehicle_name?: string;
  type?: VehicleType;
  registration_number?: string;
  daily_rent_price?: number;
  availability_status?: AvailabilityStatus;
}
