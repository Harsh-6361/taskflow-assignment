import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';
import { Role } from '../types/enums';

/**
 * Get all users
 * @route GET /api/users
 * @access Private (ADMIN only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.uid;

  try {
    const requesterDoc = await db.collection('users').doc(userId as string).get();
    if (requesterDoc.data()?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    const usersSnap = await db.collection('users').orderBy('createdAt', 'desc').get();
    
    const users = await Promise.all(usersSnap.docs.map(async (doc) => {
      const data = doc.data();
      
      const projectsCount = await db.collection('projects').where('ownerId', '==', data.id).count().get();
      const tasksCount = await db.collection('tasks').where('assignedToId', '==', data.id).count().get();

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt,
        _count: {
          ownedProjects: projectsCount.data().count,
          assignedTasks: tasksCount.data().count,
        }
      };
    }));

    return res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Error fetching users' });
  }
};

/**
 * Update user role
 * @route PATCH /api/users/:id/role
 * @access Private (ADMIN only)
 */
export const updateUserRole = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { role } = req.body;
  const requesterId = req.user?.uid;

  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (id === requesterId) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  try {
    const requesterDoc = await db.collection('users').doc(requesterId as string).get();
    if (requesterDoc.data()?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    // Update custom claim in Firebase Auth
    await auth.setCustomUserClaims(id as string, { role });

    // Update in Firestore
    await db.collection('users').doc(id as string).update({
      role,
      updatedAt: new Date().toISOString()
    });

    const updatedDoc = await db.collection('users').doc(id as string).get();
    const data = updatedDoc.data();

    return res.json({
      id: data?.id,
      name: data?.name,
      email: data?.email,
      role: data?.role
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Error updating user role' });
  }
};

/**
 * Delete a user
 * @route DELETE /api/users/:id
 * @access Private (ADMIN only)
 */
export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const requesterId = req.user?.uid;

  if (id === requesterId) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    const requesterDoc = await db.collection('users').doc(requesterId as string).get();
    if (requesterDoc.data()?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    // Delete from Firebase Auth
    await auth.deleteUser(id as string);

    // Delete from Firestore
    await db.collection('users').doc(id as string).delete();

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Error deleting user' });
  }
};
