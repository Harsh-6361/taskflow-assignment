import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MemberRole, TaskStatus, Priority } from '../types/enums';

const prisma = new PrismaClient();

/**
 * Create a new task
 * @route POST /api/tasks
 * @access Private (Project member only)
 */
export const createTask = async (req: Request, res: Response): Promise<any> => {
  const { title, description, projectId, assignedToId, priority, dueDate } = req.body;
  const userId = req.user?.userId;

  if (!title || !projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Title and valid Project ID are required' });
  }

  try {
    // Check if user is a member of the project
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userId as string,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied: You must be a project member to create tasks' });
    }

    // If assignedToId is provided, check if assignee is a member
    if (assignedToId && typeof assignedToId === 'string') {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: assignedToId,
          },
        },
      });

      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assignedToId: typeof assignedToId === 'string' ? assignedToId : null,
        createdById: userId as string,
        priority: priority || Priority.MEDIUM,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: TaskStatus.TODO,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Error creating task' });
  }
};

/**
 * Get all tasks with filtering
 * @route GET /api/tasks
 * @access Private
 */
export const getAllTasks = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.userId;
  const { projectId, status, assignedToId, priority, overdue } = req.query;

  try {
    // Build query filter
    const where: any = {};

    // Base filter: Only tasks from projects where user is a member
    where.project = {
      projectMembers: {
        some: { userId },
      },
    };

    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    if (status && typeof status === 'string') {
      where.status = status as TaskStatus;
    }

    if (assignedToId && typeof assignedToId === 'string') {
      where.assignedToId = assignedToId;
    }

    if (priority && typeof priority === 'string') {
      where.priority = priority as Priority;
    }

    if (overdue === 'true') {
      where.dueDate = {
        lt: new Date(),
      };
      where.status = {
        not: TaskStatus.DONE,
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    return res.status(500).json({ error: 'Error fetching tasks' });
  }
};

/**
 * Get task by ID
 * @route GET /api/tasks/:id
 * @access Private
 */
export const getTaskById = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        project: {
          include: {
            projectMembers: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is a member of the project
    if (!task.project || task.project.projectMembers.length === 0) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    return res.json(task);
  } catch (error) {
    console.error('Get task by ID error:', error);
    return res.status(500).json({ error: 'Error fetching task' });
  }
};

/**
 * Update task details
 * @route PUT /api/tasks/:id
 * @access Private (Creator, Assignee, or Project Admin)
 */
export const updateTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { title, description, priority, dueDate } = req.body;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            projectMembers: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.project) {
        return res.status(500).json({ error: 'Task project data is missing' });
    }

    const member = task.project.projectMembers[0];
    const isAdmin = member?.role === MemberRole.ADMIN;
    const isCreator = task.createdById === userId;
    const isAssignee = task.assignedToId === userId;

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to update this task' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    return res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Error updating task' });
  }
};

/**
 * Update task status
 * @route PATCH /api/tasks/:id/status
 * @access Private (Project member only)
 */
export const updateTaskStatus = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  if (!status || !Object.values(TaskStatus).includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            projectMembers: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.project || task.project.projectMembers.length === 0) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
    });

    return res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    return res.status(500).json({ error: 'Error updating task status' });
  }
};

/**
 * Assign task to a user
 * @route PATCH /api/tasks/:id/assign
 * @access Private (Project Admin or Creator)
 */
export const assignTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { assignedToId } = req.body;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            projectMembers: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.project) {
        return res.status(500).json({ error: 'Task project data is missing' });
    }

    const member = task.project.projectMembers[0];
    const isAdmin = member?.role === MemberRole.ADMIN;
    const isCreator = task.createdById === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Access denied: Only project admins or task creators can assign tasks' });
    }

    // If assignedToId is provided, check if assignee is a member of the project
    if (assignedToId && typeof assignedToId === 'string') {
      const assigneeMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: assignedToId,
          },
        },
      });

      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { assignedToId: typeof assignedToId === 'string' ? assignedToId : null },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json(updatedTask);
  } catch (error) {
    console.error('Assign task error:', error);
    return res.status(500).json({ error: 'Error assigning task' });
  }
};

/**
 * Delete a task
 * @route DELETE /api/tasks/:id
 * @access Private (Creator or Project Admin)
 */
export const deleteTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            projectMembers: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.project) {
        return res.status(500).json({ error: 'Task project data is missing' });
    }

    const member = task.project.projectMembers[0];
    const isAdmin = member?.role === MemberRole.ADMIN;
    const isCreator = task.createdById === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Access denied: Only project admins or task creators can delete tasks' });
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Error deleting task' });
  }
};
