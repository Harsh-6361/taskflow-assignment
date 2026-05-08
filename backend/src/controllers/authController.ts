import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';
import { z } from 'zod';
import { validate } from '../utils/validation';

// Zod schemas for validation
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: any;
  updatedAt: any;
}

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

    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });

      // Set custom claim for role
      await auth.setCustomUserClaims(userRecord.uid, { role: 'MEMBER' });

      // Create user document in Firestore
      const userDoc = {
        id: userRecord.uid,
        email,
        name,
        role: 'MEMBER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection('users').doc(userRecord.uid).set(userDoc);

      res.status(201).json({
        user: userDoc,
        message: 'User created successfully'
      });
    } catch (firebaseError: any) {
      console.error('Firebase Auth Error:', firebaseError);
      if (firebaseError.code === 'auth/email-already-exists') {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }
      if (firebaseError.code === 'auth/configuration-not-found') {
        res.status(500).json({ error: 'Firebase Authentication is not enabled in the Firebase Console. Please go to your Firebase project and enable Email/Password Authentication.' });
        return;
      }
      res.status(500).json({ error: firebaseError.message || 'Firebase initialization error' });
      return;
    }
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * Login user (Verification only)
 * Since Firebase handles login on the frontend, this endpoint validates the token
 * and returns the user data from Firestore.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found in database' });
      return;
    }

    res.status(200).json({
      user: userDoc.data(),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Get current authenticated user
 * @param req - Express Request
 * @param res - Express Response
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: userDoc.data(),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};