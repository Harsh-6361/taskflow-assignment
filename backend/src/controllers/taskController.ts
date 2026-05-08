import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { MemberRole, TaskStatus, Priority } from '../types/enums';

/**
 * Create a new task
 * @route POST /api/tasks
 * @access Private (Project member only)
 */
export const createTask = async (req: Request, res: Response): Promise<any> => {
  const { title, description, projectId, assignedToId, priority, dueDate } = req.body;
  const userId = req.user?.uid;

  if (!title || !projectId || typeof projectId !== 'string') {
    return res.status(400).json({ error: 'Title and valid Project ID are required' });
  }

  try {
    // Check if user is a member of the project
    const memberDoc = await db.collection('projectMembers').doc(`${projectId}_${userId}`).get();

    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied: You must be a project member to create tasks' });
    }

    // If assignedToId is provided, check if assignee is a member
    if (assignedToId && typeof assignedToId === 'string') {
      const assigneeMemberDoc = await db.collection('projectMembers').doc(`${projectId}_${assignedToId}`).get();
      if (!assigneeMemberDoc.exists) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    const taskRef = db.collection('tasks').doc();
    const taskData = {
      id: taskRef.id,
      title,
      description: description || '',
      projectId,
      assignedToId: typeof assignedToId === 'string' ? assignedToId : null,
      createdById: userId as string,
      priority: priority || Priority.MEDIUM,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      status: TaskStatus.TODO,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await taskRef.set(taskData);

    // Fetch related info for response
    const creatorDoc = await db.collection('users').doc(userId as string).get();
    const assigneeDoc = taskData.assignedToId ? await db.collection('users').doc(taskData.assignedToId).get() : null;

    return res.status(201).json({
      ...taskData,
      createdBy: creatorDoc.data(),
      assignedTo: assigneeDoc ? assigneeDoc.data() : null
    });
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
  const userId = req.user?.uid;
  const { projectId, status, assignedToId, priority, overdue } = req.query;

  try {
    // In Firestore, complex filtering requires indexes or manual filtering
    // We'll start by fetching projects the user is a member of
    const memberSnap = await db.collection('projectMembers').where('userId', '==', userId).get();
    const userProjectIds = memberSnap.docs.map(doc => doc.data().projectId);

    if (userProjectIds.length === 0) return res.json([]);

    let query: any = db.collection('tasks');

    // Filter by projectIds user belongs to
    // Firestore 'in' limit is 10/30, for now we'll assume it's okay or filter manually
    query = query.where('projectId', 'in', userProjectIds);

    if (projectId && typeof projectId === 'string') {
      query = query.where('projectId', '==', projectId);
    }

    if (status && typeof status === 'string') {
      query = query.where('status', '==', status);
    }

    if (assignedToId && typeof assignedToId === 'string') {
      query = query.where('assignedToId', '==', assignedToId);
    }

    if (priority && typeof priority === 'string') {
      query = query.where('priority', '==', priority);
    }

    const tasksSnap = await query.get();
    let tasks = await Promise.all(tasksSnap.docs.map(async (doc: any) => {
      const data = doc.data();
      const creatorDoc = await db.collection('users').doc(data.createdById).get();
      const assigneeDoc = data.assignedToId ? await db.collection('users').doc(data.assignedToId).get() : null;
      const projectDoc = await db.collection('projects').doc(data.projectId).get();

      return {
        ...data,
        createdBy: creatorDoc.data(),
        assignedTo: assigneeDoc ? assigneeDoc.data() : null,
        project: projectDoc.data()
      };
    }));

    // Handle overdue manually
    if (overdue === 'true') {
      const now = new Date().getTime();
      tasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== TaskStatus.DONE);
    }

    // Sort manually
    tasks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    return res.status(500).json({ error: 'Error fetching tasks' });
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.uid;

  try {
    const taskDoc = await db.collection('tasks').doc(id as string).get();
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = taskDoc.data();

    // Check project membership
    const memberDoc = await db.collection('projectMembers').doc(`${taskData?.projectId}_${userId}`).get();
    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    const creatorDoc = await db.collection('users').doc(taskData?.createdById).get();
    const assigneeDoc = taskData?.assignedToId ? await db.collection('users').doc(taskData.assignedToId).get() : null;
    const projectDoc = await db.collection('projects').doc(taskData?.projectId).get();

    return res.json({
      ...taskData,
      createdBy: creatorDoc.data(),
      assignedTo: assigneeDoc ? assigneeDoc.data() : null,
      project: projectDoc.data()
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    return res.status(500).json({ error: 'Error fetching task' });
  }
};

/**
 * Update task details
 */
export const updateTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { title, description, priority, dueDate } = req.body;
  const userId = req.user?.uid;

  try {
    const taskDoc = await db.collection('tasks').doc(id as string).get();
    if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found' });
    const taskData = taskDoc.data();

    const memberDoc = await db.collection('projectMembers').doc(`${taskData?.projectId}_${userId}`).get();
    const memberData = memberDoc.data();

    const isAdmin = memberData?.role === MemberRole.ADMIN;
    const isCreator = taskData?.createdById === userId;
    const isAssignee = taskData?.assignedToId === userId;

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to update this task' });
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate).toISOString() : null;

    await db.collection('tasks').doc(id as string).update(updateData);

    const updatedDoc = await db.collection('tasks').doc(id as string).get();
    return res.json(updatedDoc.data());
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Error updating task' });
  }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user?.uid;

  if (!status || !Object.values(TaskStatus).includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    const taskDoc = await db.collection('tasks').doc(id as string).get();
    if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found' });
    const taskData = taskDoc.data();

    const memberDoc = await db.collection('projectMembers').doc(`${taskData?.projectId}_${userId}`).get();
    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this project' });
    }

    await db.collection('tasks').doc(id as string).update({
      status,
      updatedAt: new Date().toISOString()
    });

    const updatedDoc = await db.collection('tasks').doc(id as string).get();
    return res.json(updatedDoc.data());
  } catch (error) {
    console.error('Update task status error:', error);
    return res.status(500).json({ error: 'Error updating task status' });
  }
};

/**
 * Assign task to a user
 */
export const assignTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { assignedToId } = req.body;
  const userId = req.user?.uid;

  try {
    const taskDoc = await db.collection('tasks').doc(id as string).get();
    if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found' });
    const taskData = taskDoc.data();

    const memberDoc = await db.collection('projectMembers').doc(`${taskData?.projectId}_${userId}`).get();
    const memberData = memberDoc.data();

    const isAdmin = memberData?.role === MemberRole.ADMIN;
    const isCreator = taskData?.createdById === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Access denied: Only project admins or task creators can assign tasks' });
    }

    if (assignedToId && typeof assignedToId === 'string') {
      const assigneeMemberDoc = await db.collection('projectMembers').doc(`${taskData?.projectId}_${assignedToId}`).get();
      if (!assigneeMemberDoc.exists) {
        return res.status(400).json({ error: 'Assignee must be a member of the project' });
      }
    }

    await db.collection('tasks').doc(id as string).update({
      assignedToId: assignedToId || null,
      updatedAt: new Date().toISOString()
    });

    const updatedDoc = await db.collection('tasks').doc(id as string).get();
    const assigneeDoc = assignedToId ? await db.collection('users').doc(assignedToId).get() : null;

    return res.json({
      ...updatedDoc.data(),
      assignedTo: assigneeDoc ? assigneeDoc.data() : null
    });
  } catch (error) {
    console.error('Assign task error:', error);
    return res.status(500).json({ error: 'Error assigning task' });
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const userId = req.user?.uid;

  try {
    const taskDoc = await db.collection('tasks').doc(id as string).get();
    if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found' });
    const taskData = taskDoc.data();

    const memberDoc = await db.collection('projectMembers').doc(`${taskData?.projectId}_${userId}`).get();
    const memberData = memberDoc.data();

    const isAdmin = memberData?.role === MemberRole.ADMIN;
    const isCreator = taskData?.createdById === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Access denied: Only project admins or task creators can delete tasks' });
    }

    await db.collection('tasks').doc(id as string).delete();

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Error deleting task' });
  }
};
