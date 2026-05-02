import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-key') {
  console.warn('WARNING: Using fallback JWT secret. Please set JWT_SECRET in .env file.');
}

interface JwtPayload {
  userId: string;
}

/**
 * Generate a JWT token for a user
 * @param userId - User ID to encode in token
 * @returns string - JWT token
 */
export const generateToken = (userId: string): string => {
  try {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: '7d', // Token expires in 7 days
    });
  } catch (error) {
    throw new Error('Error generating token');
  }
};

/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns JwtPayload | null - Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};