import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { validate } from '../utils/validation';

const prisma = new PrismaClient();

// Zod schemas for validation
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Format user response without sensitive data
 * @param user - User object from database
 * @returns Formatted user object
 */
const formatUserResponse = (user: any): UserResponse => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Signup a new user
 * @param req - Express Request
 * @param res - Express Response
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = validate(signupSchema, req.body);
    if (!validation.success || !validation.data) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MEMBER', // Default role
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user and token
    res.status(201).json({
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login user
 * @param req - Express Request
 * @param res - Express Response
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = validate(loginSchema, req.body);
    if (!validation.success || !validation.data) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { email, password } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Compare password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user and token
    res.status(200).json({
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current authenticated user
 * @param req - Express Request
 * @param res - Express Response
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is attached to request (from auth middleware)
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return user details
    res.status(200).json({
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};