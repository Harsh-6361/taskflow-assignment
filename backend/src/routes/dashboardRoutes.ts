import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route /api/dashboard
 * All routes require authentication
 */
router.use(authenticateToken);

// Get overall statistics for current user
router.get('/stats', dashboardController.getStats);

// Get all tasks assigned to current user grouped by status
router.get('/my-tasks', dashboardController.getMyTasks);

// Get all overdue tasks for user
router.get('/overdue', dashboardController.getOverdueTasks);

// Get statistics for a specific project
router.get('/projects/:id/stats', dashboardController.getProjectStats);

// Get global statistics for administrators
router.get('/admin/stats', dashboardController.getAdminStats);

export default router;
