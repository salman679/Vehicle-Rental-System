import { Router } from 'express';
import { authenticate, requireAdmin, requireAdminOrOwn } from '../../middleware/auth';
import * as usersController from './users.controller';

const router = Router();

router.get('/', authenticate, requireAdmin, usersController.getAllUsers);
router.put('/:userId', authenticate, requireAdminOrOwn('userId'), usersController.updateUser);
router.delete('/:userId', authenticate, requireAdmin, usersController.deleteUser);

export default router;
