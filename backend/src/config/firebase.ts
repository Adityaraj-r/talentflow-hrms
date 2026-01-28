// backend/src/config/firebase.ts
import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    
    console.log('🔍 Looking for service account at:', serviceAccountPath);
    
    // Import the service account key
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin initialized with service account');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
  throw error;
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export default admin;
