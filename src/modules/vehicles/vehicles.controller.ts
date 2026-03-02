import { Request, Response } from 'express';
import * as vehiclesService from './vehicles.service';
import { successRes, errorRes } from '../../utils/response';

export async function createVehicle(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body;
    const vehicle = await vehiclesService.createVehicle({
      vehicle_name: body.vehicle_name,
      type: body.type,
      registration_number: body.registration_number,
      daily_rent_price: Number(body.daily_rent_price),
      availability_status: body.availability_status,
    });
    successRes(res, 201, 'Vehicle created successfully', vehicle);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create vehicle';
    if (message.includes('duplicate') || message.includes('unique') || message.includes('registration')) {
      errorRes(res, 400, 'Validation failed', 'Registration number already exists');
      return;
    }
    errorRes(res, 400, 'Validation failed', message);
  }
}

export async function getAllVehicles(_req: Request, res: Response): Promise<void> {
  try {
    const vehicles = await vehiclesService.getAllVehicles();
    const message = vehicles.length === 0 ? 'No vehicles found' : 'Vehicles retrieved successfully';
    successRes(res, 200, message, vehicles);
  } catch {
    errorRes(res, 500, 'Failed to retrieve vehicles', 'Internal error');
  }
}

export async function getVehicleById(req: Request, res: Response): Promise<void> {
  try {
    const vehicleId = parseInt(req.params.vehicleId ?? '0', 10);
    if (isNaN(vehicleId)) {
      errorRes(res, 400, 'Invalid vehicle ID', 'vehicleId must be a number');
      return;
    }
    const vehicle = await vehiclesService.getVehicleById(vehicleId);
    if (!vehicle) {
      errorRes(res, 404, 'Vehicle not found', 'Vehicle not found');
      return;
    }
    successRes(res, 200, 'Vehicle retrieved successfully', vehicle);
  } catch {
    errorRes(res, 500, 'Failed to retrieve vehicle', 'Internal error');
  }
}

export async function updateVehicle(req: Request, res: Response): Promise<void> {
  try {
    const vehicleId = parseInt(req.params.vehicleId ?? '0', 10);
    if (isNaN(vehicleId)) {
      errorRes(res, 400, 'Invalid vehicle ID', 'vehicleId must be a number');
      return;
    }
    const body = req.body;
    const updates: Record<string, unknown> = {};
    if (body.vehicle_name !== undefined) updates.vehicle_name = body.vehicle_name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.registration_number !== undefined) updates.registration_number = body.registration_number;
    if (body.daily_rent_price !== undefined) updates.daily_rent_price = Number(body.daily_rent_price);
    if (body.availability_status !== undefined) updates.availability_status = body.availability_status;

    const vehicle = await vehiclesService.updateVehicle(vehicleId, updates as Parameters<typeof vehiclesService.updateVehicle>[1]);
    if (!vehicle) {
      errorRes(res, 404, 'Vehicle not found', 'Vehicle not found');
      return;
    }
    successRes(res, 200, 'Vehicle updated successfully', vehicle);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update vehicle';
    if (message.includes('duplicate') || message.includes('unique')) {
      errorRes(res, 400, 'Validation failed', 'Registration number already exists');
      return;
    }
    errorRes(res, 400, 'Validation failed', message);
  }
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  try {
    const vehicleId = parseInt(req.params.vehicleId ?? '0', 10);
    if (isNaN(vehicleId)) {
      errorRes(res, 400, 'Invalid vehicle ID', 'vehicleId must be a number');
      return;
    }
    const vehicle = await vehiclesService.getVehicleById(vehicleId);
    if (!vehicle) {
      errorRes(res, 404, 'Vehicle not found', 'Vehicle not found');
      return;
    }
    await vehiclesService.deleteVehicle(vehicleId);
    successRes(res, 200, 'Vehicle deleted successfully', undefined);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete vehicle';
    if (message.includes('active bookings')) {
      errorRes(res, 400, 'Cannot delete vehicle', message);
      return;
    }
    errorRes(res, 500, 'Failed to delete vehicle', message);
  }
}
