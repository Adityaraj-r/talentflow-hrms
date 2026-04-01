import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedPayrollSampleData } from '../utils/seedPayrollSample';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  try {
    await seedPayrollSampleData();
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
