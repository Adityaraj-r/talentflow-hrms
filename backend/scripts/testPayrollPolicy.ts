import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { seedPayrollPolicies } from '../utils/payrollPolicySeeder';
import { getActivePolicy, calculateSlabTax, getFlatSlabAmount } from '../services/payrollPolicy.service';

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('Connected to in-memory MongoDB');

  await seedPayrollPolicies();
  console.log('Policies seeded');

  // Test PF lookup
  const pfPolicy = await getActivePolicy('PF_RATE', new Date('2026-07-01'));
  console.log('PF policy:', pfPolicy?.rules);

  // Test PT lookup for Maharashtra
  const ptPolicy = await getActivePolicy('PT_SLAB', new Date('2026-07-01'), 'Maharashtra');
  console.log('PT policy found:', !!ptPolicy);
  if (ptPolicy) {
    console.log('PT for gross 9000:', getFlatSlabAmount(9000, ptPolicy.rules.slabs)); // expect 175
    console.log('PT for gross 5000:', getFlatSlabAmount(5000, ptPolicy.rules.slabs)); // expect 0
    console.log('PT for gross 15000:', getFlatSlabAmount(15000, ptPolicy.rules.slabs)); // expect 200
  }

  // Test TDS slab math directly
  const taxPolicy = await getActivePolicy('TAX_SLAB', new Date('2026-07-01'));
  const annualTax = calculateSlabTax(800000 - (taxPolicy?.rules.standardDeduction || 0), taxPolicy?.rules.slabs || []);
  console.log('Annual tax on 8L income:', annualTax);

  await mongoose.disconnect();
  await mongod.stop();
  console.log('Done');
}

main().catch(console.error);