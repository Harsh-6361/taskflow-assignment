import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const initializeFirebase = () => {
  // Option 1: Load from JSON string in environment variable (Best for Production/Cloud)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    }
  }

  // Option 2: Load from local file path (Best for Local Development)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, '../../firebase-service-account.json.json');

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
};

const app = initializeFirebase();

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
