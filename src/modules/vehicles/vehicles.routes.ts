import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth';
import * as vehiclesController from './vehicles.controller';

const router = Router();

router.post('/', authenticate, requireAdmin, vehiclesController.createVehicle);
router.get('/', vehiclesController.getAllVehicles);
router.get('/:vehicleId', vehiclesController.getVehicleById);
router.put('/:vehicleId', authenticate, requireAdmin, vehiclesController.updateVehicle);
router.delete('/:vehicleId', authenticate, requireAdmin, vehiclesController.deleteVehicle);

export default router;
