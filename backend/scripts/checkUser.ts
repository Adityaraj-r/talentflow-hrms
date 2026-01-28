// backend/src/scripts/checkUser.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkUsers = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || '';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    
    console.log(`Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log('  ID:', user._id);
      console.log('  Email:', user.email);
      console.log('  Firebase UID:', user.firebaseUid || '❌ NOT SET');
      console.log('  Role:', user.role);
      console.log('  Active:', user.isActive);
      console.log('');
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

checkUsers();
