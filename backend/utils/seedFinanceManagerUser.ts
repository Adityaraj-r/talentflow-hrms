import bcrypt from 'bcryptjs';
import User from '../models/User.model';

/**
 * Ensures a Finance Manager account exists (same pattern as other seeded HRMS users).
 * Defaults: finance@hrms.com — override with FINANCE_MANAGER_SEED_EMAIL / FINANCE_MANAGER_SEED_PASSWORD in any environment.
 */
export const seedFinanceManagerUser = async (): Promise<void> => {
  const email = (process.env.FINANCE_MANAGER_SEED_EMAIL || 'finance@hrms.com').toLowerCase();
  const password = process.env.FINANCE_MANAGER_SEED_PASSWORD || '123456';

  const existing = await User.findOne({ email });
  if (existing) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await User.create({
    email,
    password: hashedPassword,
    firstName: 'Finance',
    lastName: 'Manager',
    role: 'FINANCE_MANAGER',
    department: 'Finance',
    isEmailVerified: true,
    isActive: true,
  });

  console.log(`✅ Seeded Finance Manager user: ${email}`);
};
