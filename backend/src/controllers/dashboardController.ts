import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { TaskStatus, Priority, Role } from '../types/enums';
import { startOfWeek, endOfWeek } from 'date-fns';

/**
 * Get overall statistics for the current user
 */
export const getStats = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.uid;

  try {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const tasksSnap = await db.collection('tasks').where('assignedToId', '==', userId).get();
    const userTasks = tasksSnap.docs.map(doc => doc.data());

    const totalTasks = userTasks.length;
    
    // Tasks by status
    const statusCounts: Record<string, number> = {};
    Object.values(TaskStatus).forEach(status => statusCounts[status] = 0);
    
    userTasks.forEach((task: any) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    // Overdue tasks count
    const overdueCount = userTasks.filter((task: any) => 
      task.status !== TaskStatus.DONE && 
      task.dueDate && 
      new Date(task.dueDate).getTime() < now.getTime()
    ).length;

    // Completion percentage
    const completedCount = statusCounts[TaskStatus.DONE] || 0;
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedCount / totalTasks) * 100) 
      : 0;

    // Tasks due this week
    const dueThisWeekCount = userTasks.filter((task: any) => 
      task.dueDate && 
      new Date(task.dueDate).getTime() >= weekStart.getTime() && 
      new Date(task.dueDate).getTime() <= weekEnd.getTime()
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
 */
export const getMyTasks = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.uid;

  try {
    const tasksSnap = await db.collection('tasks')
      .where('assignedToId', '==', userId)
      .get();
    
    const tasks = await Promise.all(tasksSnap.docs.map(async (doc) => {
      const data = doc.data();
      const projectDoc = await db.collection('projects').doc(data.projectId).get();
      return {
        ...data,
        project: projectDoc.data()
      };
    }));

    // Group by status
    const groupedTasks: Record<string, any[]> = {};
    Object.values(TaskStatus).forEach(status => groupedTasks[status] = []);

    tasks.forEach((task: any) => {
      if (!groupedTasks[task.status]) groupedTasks[task.status] = [];
      groupedTasks[task.status].push(task);
    });

    // Sort within groups
    Object.keys(groupedTasks).forEach(status => {
      groupedTasks[status].sort((a: any, b: any) => {
        // Simple priority/date sort
        return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
      });
    });

    return res.json(groupedTasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    return res.status(500).json({ error: 'Error fetching your tasks' });
  }
};

/**
 * Get all overdue tasks for user
 */
export const getOverdueTasks = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.uid;
  const now = new Date().toISOString();

  try {
    const tasksSnap = await db.collection('tasks')
      .where('assignedToId', '==', userId)
      .where('status', '!=', TaskStatus.DONE)
      .get();
    
    let overdueTasks = await Promise.all(tasksSnap.docs.map(async (doc) => {
      const data = doc.data();
      const projectDoc = await db.collection('projects').doc(data.projectId).get();
      return {
        ...data,
        project: projectDoc.data()
      };
    }));

    // Filter by date manually because Firestore doesn't allow != and < on different fields easily without index
    overdueTasks = overdueTasks.filter((t: any) => t.dueDate && t.dueDate < now);
    overdueTasks.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return res.json(overdueTasks);
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    return res.status(500).json({ error: 'Error fetching overdue tasks' });
  }
};

/**
 * Get statistics for a specific project
 */
export const getProjectStats = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.uid;

  try {
    const memberDoc = await db.collection('projectMembers').doc(`${id}_${userId}`).get();
    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    const tasksSnap = await db.collection('tasks').where('projectId', '==', id).get();
    const tasks = await Promise.all(tasksSnap.docs.map(async (tDoc) => {
      const data = tDoc.data();
      const assignedDoc = data.assignedToId ? await db.collection('users').doc(data.assignedToId).get() : null;
      return {
        ...data,
        assignedTo: assignedDoc ? assignedDoc.data() : null
      };
    }));

    const totalTasks = tasks.length;

    // Tasks by status
    const statusCounts: Record<string, number> = {};
    tasks.forEach((task: any) => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    // Tasks by priority
    const priorityCounts: Record<string, number> = {};
    tasks.forEach((task: any) => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });

    // Member task distribution
    const memberDistribution: Record<string, { name: string; count: number }> = {};
    tasks.forEach((task: any) => {
      const memberId = task.assignedToId || 'unassigned';
      const name = task.assignedTo?.name || 'Unassigned';
      
      if (!memberDistribution[memberId]) {
        memberDistribution[memberId] = { name, count: 0 };
      }
      memberDistribution[memberId].count += 1;
    });

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
 */
export const getAdminStats = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.uid;

  try {
    const userDoc = await db.collection('users').doc(userId as string).get();
    if (userDoc.data()?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    const [usersCount, projectsCount, tasksCount, tasksSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('projects').count().get(),
      db.collection('tasks').count().get(),
      db.collection('tasks').get(),
    ]);

    // Format task counts
    const statusDistribution: Record<string, number> = {};
    tasksSnap.docs.forEach(doc => {
      const status = doc.data().status;
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // Get recent activity (last 5 projects)
    const recentProjectsSnap = await db.collection('projects')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const recentProjects = await Promise.all(recentProjectsSnap.docs.map(async (doc) => {
      const data = doc.data();
      const ownerDoc = await db.collection('users').doc(data.ownerId).get();
      return {
        ...data,
        owner: ownerDoc.data()
      };
    }));

    return res.json({
      totalUsers: usersCount.data().count,
      totalProjects: projectsCount.data().count,
      totalTasks: tasksCount.data().count,
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
