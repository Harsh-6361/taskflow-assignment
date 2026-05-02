import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if authenticated user has required role(s)
 * @param roles - Roles that are allowed to access the route
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // In a real app, you would fetch the user's role from database
      // For now, we'll assume the role is stored in the JWT payload
      // This would need to be adjusted based on your actual implementation
      
      // For demonstration purposes, we'll just check if the role is provided in a hypothetical user object
      // Since we don't have access to the database here, this is a simplified implementation
      // In practice, you'd query the database to get the user's actual role
      
      // Example implementation (would need adjustment based on your user model):
      /*
      if (!req.user.role || !roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      */
      
      // For now, let's pass through to next middleware
      // You'll need to implement proper role checking based on your database structure
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};