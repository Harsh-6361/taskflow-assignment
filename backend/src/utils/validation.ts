import { z, ZodSchema } from 'zod';

/**
 * Generic validation function
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success boolean and either data or error
 */
export const validate = <T>(schema: ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error.issues[0].message };
    }
  } catch (error) {
    return { success: false, error: 'Validation error occurred' };
  }
};