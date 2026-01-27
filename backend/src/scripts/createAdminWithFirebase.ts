// backend/src/scripts/createAdminWithFirebase.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { auth } from '../config/firebase';
import User from '../models/User.model';
import bcrypt from 'bcryptjs';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || '';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@hrms.com';
    const adminPassword = 'admin123';

    // Check if admin already exists in Firebase
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(adminEmail);
      console.log('⚠️  Firebase user already exists:', firebaseUser.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create user in Firebase
        firebaseUser = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'Admin User',
          emailVerified: true
        });
        console.log('✅ Firebase user created:', firebaseUser.uid);
      } else {
        throw error;
      }
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      // Update with Firebase UID if missing
      if (!existingUser.firebaseUid) {
        existingUser.firebaseUid = firebaseUser.uid;
        await existingUser.save();
        console.log('✅ Updated existing MongoDB user with Firebase UID');
      } else {
        console.log('⚠️  Admin user already exists in MongoDB');
      }
    } else {
      // Create user in MongoDB
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const user = await User.create({
        firebaseUid: firebaseUser.uid,
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
        phoneNumber: '+91 9876543210'
      });

      console.log('✅ MongoDB user created:', user._id);
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('📧 Email: admin@hrms.com');
    console.log('🔑 Password: admin123');
    console.log('🔥 Firebase UID:', firebaseUser.uid);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdminUser();
