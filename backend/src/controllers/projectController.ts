import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MemberRole, Role } from '../types/enums';

const prisma = new PrismaClient();

/**
 * Create a new project
 * @route POST /api/projects
 * @access Private (ADMIN or TEAM_LEADER only)
 */
export const createProject = async (req: Request, res: Response): Promise<any> => {
  const { name, description } = req.body;
  const ownerId = req.user?.userId;

  if (!ownerId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    // Check if user has permission to create projects (ADMIN or TEAM_LEADER)
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!user || (user.role !== Role.ADMIN && user.role !== Role.TEAM_LEADER)) {
      return res.status(403).json({ error: 'Access denied: Only Admins or Team Leaders can create projects' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId,
        projectMembers: {
          create: {
            userId: ownerId,
            role: MemberRole.ADMIN, // Creator becomes the Project Admin
          },
        },
      },
      include: {
        projectMembers: true,
        _count: {
          select: { projectMembers: true },
        },
      },
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Error creating project' });
  }
};

/**
 * Get all projects for the authenticated user
 * @route GET /api/projects
 * @access Private
 */
export const getAllProjects = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { projectMembers: { some: { userId } } },
        ],
      },
      include: {
        _count: {
          select: { projectMembers: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(projects);
  } catch (error) {
    console.error('Get all projects error:', error);
    return res.status(500).json({ error: 'Error fetching projects' });
  }
};

/**
 * Get project by ID
 * @route GET /api/projects/:id
 * @access Private
 */
export const getProjectById = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.projectMembers.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    // Task count by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: id,
      },
      _count: true,
    });

    // Format task counts into a more readable object
    const taskStats = tasksByStatus.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    return res.json({
      ...project,
      taskStats,
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    return res.status(500).json({ error: 'Error fetching project' });
  }
};

/**
 * Update project details
 * @route PUT /api/projects/:id
 * @access Private (ADMIN member only)
 */
export const updateProject = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    // Check if user is an ADMIN member of the project
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId as string,
        },
      },
    });

    if (!member || member.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can update project details' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
      },
    });

    return res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Error updating project' });
  }
};

/**
 * Delete a project
 * @route DELETE /api/projects/:id
 * @access Private (Owner only)
 */
export const deleteProject = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the project owner can delete the project' });
    }

    // Cascade delete is handled by database if configured in Prisma schema (onDelete: Cascade)
    await prisma.project.delete({
      where: { id },
    });

    return res.json({ message: 'Project and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Error deleting project' });
  }
};

/**
 * Get all members of a project
 * @route GET /api/projects/:id/members
 * @access Private (Member only)
 */
export const getProjectMembers = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isMember = project.projectMembers.some((m: any) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    return res.json(project.projectMembers);
  } catch (error) {
    console.error('Get project members error:', error);
    return res.status(500).json({ error: 'Error fetching project members' });
  }
};

/**
 * Add a member to a project
 * @route POST /api/projects/:id/members
 * @access Private (ADMIN member only)
 */
export const addProjectMember = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { email, role } = req.body;
  const adminId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid user email is required' });
  }

  try {
    // Check if requester is ADMIN of the project
    const adminMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: adminId as string,
        },
      },
    });

    if (!adminMember || adminMember.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can add members' });
    }

    // Check if user to add exists
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: role || MemberRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json(newMember);
  } catch (error) {
    console.error('Add project member error:', error);
    return res.status(500).json({ error: 'Error adding project member' });
  }
};

/**
 * Remove a member from a project
 * @route DELETE /api/projects/:id/members/:userId
 * @access Private (ADMIN member only)
 */
export const removeProjectMember = async (req: Request, res: Response): Promise<any> => {
  const { id, userId } = req.params;
  const adminId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Check if requester is ADMIN of the project
    const adminMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: adminId as string,
        },
      },
    });

    if (!adminMember || adminMember.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can remove members' });
    }

    // Check if project exists and get owner
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Cannot remove project owner
    if (project.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove the project owner from the project' });
    }

    // Remove member
    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId,
        },
      },
    });

    return res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove project member error:', error);
    return res.status(500).json({ error: 'Error removing project member' });
  }
};

/**
 * Update a member's role
 * @route PATCH /api/projects/:id/members/:userId/role
 * @access Private (ADMIN member only)
 */
export const updateMemberRole = async (req: Request, res: Response): Promise<any> => {
  const { id, userId } = req.params;
  const { role } = req.body;
  const adminId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (!role || !Object.values(MemberRole).includes(role)) {
    return res.status(400).json({ error: 'Valid role is required' });
  }

  try {
    // Check if requester is ADMIN of the project
    const adminMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: adminId as string,
        },
      },
    });

    if (!adminMember || adminMember.role !== MemberRole.ADMIN) {
      return res.status(403).json({ error: 'Only project administrators can update roles' });
    }

    // Check if project exists and get owner
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Cannot change owner's role (should always be ADMIN)
    if (project.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot change the role of the project owner' });
    }

    const updatedMember = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json(updatedMember);
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({ error: 'Error updating member role' });
  }
};
