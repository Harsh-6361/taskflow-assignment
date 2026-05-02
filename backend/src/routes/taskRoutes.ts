import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route /api/tasks
 * All routes require authentication
 */
router.use(authenticateToken);

// Create a task
router.post('/', taskController.createTask);

// Get all tasks (with filtering)
router.get('/', taskController.getAllTasks);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Update task details
router.put('/:id', taskController.updateTask);

// Update task status
router.patch('/:id/status', taskController.updateTaskStatus);

// Assign task
router.patch('/:id/assign', taskController.assignTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

export default router;
