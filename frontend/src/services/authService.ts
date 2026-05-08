import api from './api';
import type { AuthResponse, User } from '../types';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const authService = {
  signup: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    // We still use our backend signup because it handles Firestore user creation and custom claims
    const response = await api.post<AuthResponse>('/auth/signup', { name, email, password });
    
    // After backend signup, we need to login on the frontend to get the token
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('token', token);
    
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    // 1. Sign in with Firebase on the frontend
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    // 2. Store token
    localStorage.setItem('token', token);
    
    // 3. Call backend to verify and get user info from Firestore
    // Our refactored backend login endpoint now expects the token in the header
    const response = await api.post<AuthResponse>('/auth/login', {});
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('token');
  },
};
