import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route /api/projects
 * All routes require authentication
 */
router.use(authenticateToken);

// Create a project
router.post('/', projectController.createProject);

// Get all projects for user
router.get('/', projectController.getAllProjects);

// Get project by ID
router.get('/:id', projectController.getProjectById);

// Update project
router.put('/:id', projectController.updateProject);

// Delete project
router.delete('/:id', projectController.deleteProject);

// Team Management
// Get project members
router.get('/:id/members', projectController.getProjectMembers);

// Add project member
router.post('/:id/members', projectController.addProjectMember);

// Remove project member
router.delete('/:id/members/:userId', projectController.removeProjectMember);

// Update member role
router.patch('/:id/members/:userId/role', projectController.updateMemberRole);

export default router;
