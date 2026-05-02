import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
    };
  }
}

/**
 * Middleware to authenticate JWT token
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Attach user to request object
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};