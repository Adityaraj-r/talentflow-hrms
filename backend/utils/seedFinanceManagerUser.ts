import bcrypt from 'bcryptjs';
import User from '../models/User.model';

/**
 * Optionally ensures a Finance Manager account exists when both local seed
 * credentials are explicitly configured. No account or default password is
 * created when those credentials are absent.
 */
export const seedFinanceManagerUser = async (): Promise<void> => {
  const configuredEmail = process.env.FINANCE_MANAGER_SEED_EMAIL?.trim();
  const password = process.env.FINANCE_MANAGER_SEED_PASSWORD;

  if (!configuredEmail && !password) {
    console.log('Finance Manager seed skipped; explicit seed credentials are not configured.');
    return;
  }

  if (!configuredEmail || !password) {
    throw new Error('Set both FINANCE_MANAGER_SEED_EMAIL and FINANCE_MANAGER_SEED_PASSWORD to seed a Finance Manager.');
  }

  const email = configuredEmail.toLowerCase();

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

  console.log('Seeded the explicitly configured Finance Manager account.');
};
