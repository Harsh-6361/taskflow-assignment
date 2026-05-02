import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route /api/users
 * All routes require authentication
 */
router.use(authenticateToken);

// Get all users
router.get('/', userController.getAllUsers);

// Update user role
router.patch('/:id/role', userController.updateUserRole);

// Delete user
router.delete('/:id', userController.deleteUser);

export default router;
