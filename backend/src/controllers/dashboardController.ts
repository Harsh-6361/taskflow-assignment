import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TaskStatus, Priority } from '../types/enums';
import { startOfWeek, endOfWeek } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Get overall statistics for the current user
 * @route GET /api/dashboard/stats
 * @access Private
 */
export const getStats = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.userId;

  try {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Get all tasks assigned to user
    const userTasks = await prisma.task.findMany({
      where: { assignedToId: userId },
    });

    const totalTasks = userTasks.length;
    
    // Tasks by status
    const statusCounts = userTasks.reduce((acc: any, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // Ensure all statuses exist in the response
    Object.values(TaskStatus).forEach(status => {
      if (!statusCounts[status]) statusCounts[status] = 0;
    });

    // Overdue tasks count
    const overdueCount = userTasks.filter(task => 
      task.status !== TaskStatus.DONE && 
      task.dueDate && 
      task.dueDate < now
    ).length;

    // Completion percentage
    const completedCount = statusCounts[TaskStatus.DONE] || 0;
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedCount / totalTasks) * 100) 
      : 0;

    // Tasks due this week
    const dueThisWeekCount = userTasks.filter(task => 
      task.dueDate && 
      task.dueDate >= weekStart && 
      task.dueDate <= weekEnd
    ).length;

    return res.json({
      totalTasks,
      statusCounts,
      overdueCount,
      completionPercentage,
      dueThisWeekCount
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Error fetching dashboard statistics' });
  }
};

/**
 * Get all tasks assigned to current user grouped by status
 * @route GET /api/dashboard/my-tasks
 * @access Private
 */
export const getMyTasks = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.userId;

  try {
    const tasks = await prisma.task.findMany({
      where: { assignedToId: userId },
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    // Group by status
    const groupedTasks = tasks.reduce((acc: any, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {});

    // Ensure all statuses exist
    Object.values(TaskStatus).forEach(status => {
      if (!groupedTasks[status]) groupedTasks[status] = [];
    });

    return res.json(groupedTasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    return res.status(500).json({ error: 'Error fetching your tasks' });
  }
};

/**
 * Get all overdue tasks for user
 * @route GET /api/dashboard/overdue
 * @access Private
 */
export const getOverdueTasks = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.userId;
  const now = new Date();

  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: TaskStatus.DONE },
        dueDate: { lt: now }
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return res.json(overdueTasks);
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    return res.status(500).json({ error: 'Error fetching overdue tasks' });
  }
};

/**
 * Get statistics for a specific project
 * @route GET /api/dashboard/projects/:id/stats
 * @access Private (Project member only)
 */
export const getProjectStats = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }

  try {
    // Check project membership
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId as string
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    });

    const totalTasks = tasks.length;

    // Tasks by status
    const statusCounts = tasks.reduce((acc: any, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    // Tasks by priority
    const priorityCounts = tasks.reduce((acc: any, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    // Member task distribution
    const memberDistribution = tasks.reduce((acc: any, task: any) => {
      const memberId = task.assignedToId || 'unassigned';
      const name = task.assignedTo?.name || 'Unassigned';
      
      if (!acc[memberId]) {
        acc[memberId] = { name, count: 0 };
      }
      acc[memberId].count += 1;
      return acc;
    }, {});

    // Completion rate
    const completedCount = statusCounts[TaskStatus.DONE] || 0;
    const completionRate = totalTasks > 0 
      ? Math.round((completedCount / totalTasks) * 100) 
      : 0;

    return res.json({
      totalTasks,
      statusCounts,
      priorityCounts,
      memberDistribution,
      completionRate
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    return res.status(500).json({ error: 'Error fetching project statistics' });
  }
};

/**
 * Get global statistics for system administrators
 * @route GET /api/dashboard/admin/stats
 * @access Private (ADMIN only)
 */
export const getAdminStats = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.userId;

  try {
    // Verify user is a global ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    const [totalUsers, totalProjects, totalTasks, tasksByStatus] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Format task counts
    const statusDistribution = tasksByStatus.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    // Get recent activity (last 5 projects)
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { name: true }
        }
      }
    });

    return res.json({
      totalUsers,
      totalProjects,
      totalTasks,
      statusDistribution,
      recentProjects,
      systemHealth: {
        status: 'Healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ error: 'Error fetching admin statistics' });
  }
};
