import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '/Users/aditya/Desktop/HRMS/backend/.env' });

import User from '../models/User.model';
import Employee from '../models/Employee.model';

const migrate = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  const usersWithoutEmployee = await User.find({
  $or: [
    { employeeId: null },
    { employeeId: { $exists: false } },
    { employeeCode: null },
    { employeeCode: { $exists: false } }
  ],
  isDeleted: { $ne: true },
});

  console.log(`🔍 Found ${usersWithoutEmployee.length} users without Employee documents`);

  let success = 0;
  let failed  = 0;

  for (const user of usersWithoutEmployee) {
    try {
      const existingEmployee = await Employee.findOne({ email: user.email });

      if (existingEmployee) {
        await User.findByIdAndUpdate(user._id, {
          employeeId:   existingEmployee._id,
          employeeCode: existingEmployee.employeeCode,
        });
        console.log(`🔗 Linked existing Employee for ${user.email}`);
        success++;
        continue;
      }

      const empCount = await Employee.countDocuments();
      const employeeCode = `EMP-${String(empCount + 1).padStart(4, '0')}`;

      const employee = await Employee.create({
        userId:      user._id,
        employeeCode,
        email:       user.email,
        firstName:   user.firstName,
        lastName:    user.lastName,
        phoneNumber: user.phoneNumber || 'N/A',
        department:  user.department  || '',
        gender:      user.gender      || '',
        role:        user.role,
        status:      user.isActive ? 'Active' : 'Inactive',
        onboardingStatus: 'Personal',
        salary: {
          basic: 0,
          allowances: { hra: 0, transport: 0, medical: 0, other: 0 },
          deductions: { pf: 0,  tax: 0,       insurance: 0 },
        },
      });

      await User.findByIdAndUpdate(user._id, {
        employeeId:   employee._id,
        employeeCode: employee.employeeCode,
      });

      console.log(`Migrated: ${user.email} -> ${employeeCode}`);
      success++;
    } catch (err: any) {
      console.error(`Failed for ${user.email}: ${err.message}`);
      failed++;
    }
  }

  console.log('\nMigration complete');
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  await mongoose.disconnect();
  process.exit(0);
};

migrate();
