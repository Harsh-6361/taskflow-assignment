import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types/enums';

const prisma = new PrismaClient();

/**
 * Get all users
 * @route GET /api/users
 * @access Private (ADMIN only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?.userId;

  try {
    const requester = await prisma.user.findUnique({ where: { id: userId as string } });
    if (requester?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            assignedTasks: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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
  const requesterId = req.user?.userId;

  if (!Object.values(Role).includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (id === requesterId) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  try {
    const requester = await prisma.user.findUnique({ where: { id: requesterId as string } });
    if (requester?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: id as string },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    return res.json(updatedUser);
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
  const requesterId = req.user?.userId;

  if (id === requesterId) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    const requester = await prisma.user.findUnique({ where: { id: requesterId as string } });
    if (requester?.role !== Role.ADMIN) {
      return res.status(403).json({ error: 'Access denied: Admin permissions required' });
    }

    await prisma.user.delete({
      where: { id: id as string }
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Error deleting user' });
  }
};
