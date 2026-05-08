import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      uid: string;
      email?: string;
      role?: string;
    };
  }
}

/**
 * Middleware to authenticate Firebase ID token
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header missing' });
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      res.status(401).json({ error: 'Token missing' });
      return;
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Attach user to request object
      // We map Firebase's 'uid' to what the app expects, or just use 'uid'
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: (decodedToken.role as string) || 'MEMBER' // We'll handle roles via custom claims or Firestore
      };
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};