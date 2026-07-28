// payrollPolicySeeder.ts
import { PayrollPolicy } from '../models/payrollPolicy.model';

export async function seedPayrollPolicies() {
    await PayrollPolicy.create([
        {
            policyType: 'TAX_SLAB',
            version: 1,
            effectiveFrom: new Date('2026-04-01'),
            effectiveTo: null,
            rules: {
                slabs: [
                    { min: 0, max: 300000, rate: 0 },
                    { min: 300000, max: 700000, rate: 5 },
                    { min: 700000, max: 1000000, rate: 10 },
                    { min: 1000000, max: 1200000, rate: 15 },
                    { min: 1200000, max: 1500000, rate: 20 },
                    { min: 1500000, max: null, rate: 30 },
                ],
                standardDeduction: 75000,
            },
            changeNote: 'FY 2026-27 new regime slabs',
        },
        {
            policyType: 'PF_RATE',
            version: 1,
            effectiveFrom: new Date('2026-04-01'),
            effectiveTo: null,
            rules: { employeeRate: 12, employerRate: 12, wageCeiling: 15000 },
            changeNote: 'Standard EPFO rate',
        },
        {
            policyType: 'ESI_RATE',
            version: 1,
            effectiveFrom: new Date('2026-04-01'),
            effectiveTo: null,
            rules: { employeeRate: 0.75, employerRate: 3.25, eligibilityThreshold: 21000 },
            changeNote: 'Standard ESIC rate',
        },
        {
            policyType: 'PT_SLAB',
            state: 'maharashtra',   // normalized — matches normalizeStateName('Maharashtra')
            version: 1,
            effectiveFrom: new Date('2026-04-01'),
            effectiveTo: null,
            rules: {
                slabs: [
                    { min: 0, max: 7500, rate: 0 },
                    { min: 7500, max: 10000, rate: 175 },   // note: see caveat below
                    { min: 10000, max: null, rate: 200 },
                ],
            },
            changeNote: 'Maharashtra PT slab',
        },
    ]);
}