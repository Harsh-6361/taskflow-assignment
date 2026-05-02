import { User } from '@prisma/client';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        // Add other properties as needed based on your JWT payload
        // role?: 'ADMIN' | 'MEMBER';
      };
    }
  }
}

// Export empty declaration to satisfy TypeScript module system
export {};