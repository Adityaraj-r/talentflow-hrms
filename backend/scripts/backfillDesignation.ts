/**
 * One-off backfill: copy designation, department, profilePhoto from Employee → User
 * for users missing designation. Match by email (Employee.email or workEmail).
 */

import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Employee from '../models/Employee.model';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function profilePhotoFromEmployee(emp: {
  Documents?: { passportPhotoPath?: string };
}): string | undefined {
  const p = emp.Documents?.passportPhotoPath;
  return p && String(p).trim() ? String(p).trim() : undefined;
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const users = await User.find({
    $or: [
      { designation: { $exists: false } },
      { designation: null },
      { designation: '' },
    ],
    isDeleted: { $ne: true },
  }).select('_id email designation department profilePhoto');

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const userEmail = String(user.email || '')
      .trim()
      .toLowerCase();
    if (!userEmail) {
      skipped++;
      continue;
    }

    const emp = await Employee.findOne({
      $or: [{ email: userEmail }, { workEmail: userEmail }],
    }).lean();

    if (!emp) {
      skipped++;
      continue;
    }

    const $set: Record<string, string> = {};

    if (emp.designation != null && String(emp.designation).trim()) {
      $set.designation = String(emp.designation).trim();
    }
    if (emp.department != null && String(emp.department).trim()) {
      $set.department = String(emp.department).trim();
    }
    const photo = profilePhotoFromEmployee(emp);
    if (photo) {
      $set.profilePhoto = photo;
    }

    if (Object.keys($set).length === 0) {
      continue;
    }

    const res = await User.updateOne({ _id: user._id }, { $set });
    if (res.modifiedCount > 0) {
      updated++;
    }
  }

  console.log('\nBackfill designation / department / profilePhoto complete.');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no matching Employee found): ${skipped}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
