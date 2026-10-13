import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose, { ClientSession } from 'mongoose';
import User from '../models/User.model';
import Role from '../models/Role.model';

// This bootstrap is intentionally pinned to the Atlas cluster verified by the owner.
const APPROVED_ATLAS_HOST = 'cluster0.7qgx73w.mongodb.net';
const APPROVED_DATABASE = 'talentflow';
const BOOTSTRAP_COLLECTION = '_talentflow_admin_bootstrap';
const BOOTSTRAP_MARKER_ID = 'initial-admin-created-v1';

function bootstrapCollection(): mongoose.mongo.Collection<{ _id: string; createdAt: Date }> {
  return mongoose.connection.collection(BOOTSTRAP_COLLECTION) as unknown as mongoose.mongo.Collection<{
    _id: string;
    createdAt: Date;
  }>;
}

export interface BootstrapConfig {
  uri: string;
  email: string;
  password: string;
  firstName: string;
}

type BootstrapResult = 'created' | 'existing-admin' | 'already-bootstrapped';

export function readBootstrapConfig(env: NodeJS.ProcessEnv): BootstrapConfig {
  if ((env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new Error('Admin bootstrap is disabled in production.');
  }

  const uri = env.MONGODB_URI?.trim();
  const email = env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.INITIAL_ADMIN_PASSWORD;
  const firstName = env.INITIAL_ADMIN_FIRST_NAME?.trim();
  if (!uri || !email || !password || !firstName) {
    throw new Error('Required local Admin bootstrap configuration is missing.');
  }

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('MongoDB target configuration is invalid.');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  const databaseOverrides = parsed.searchParams.getAll('dbName');
  if (
    !['mongodb+srv:', 'mongodb:'].includes(parsed.protocol) ||
    parsed.hostname.toLowerCase() !== APPROVED_ATLAS_HOST ||
    database !== APPROVED_DATABASE ||
    databaseOverrides.some((override) => override !== APPROVED_DATABASE)
  ) {
    throw new Error('MongoDB target is not the approved TalentFlow development database.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Admin email configuration is invalid.');
  }
  if (Array.from(password).length < 16 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Admin password must be at least 16 characters and no more than 72 UTF-8 bytes.');
  }
  if (firstName.length > 100) {
    throw new Error('Admin first name configuration is invalid.');
  }

  return { uri, email, password, firstName };
}

interface BootstrapDependencies {
  connect(uri: string): Promise<void>;
  disconnect(): Promise<void>;
  withTransaction<T>(callback: (session: ClientSession) => Promise<T>): Promise<T>;
  markerExists(session: ClientSession): Promise<boolean>;
  activeAdminExists(session: ClientSession): Promise<boolean>;
  adminRoleExists(session: ClientSession): Promise<boolean>;
  emailExists(email: string, session: ClientSession): Promise<boolean>;
  insertMarker(session: ClientSession): Promise<void>;
  createAdmin(user: Record<string, unknown>, session: ClientSession): Promise<void>;
  hashPassword(password: string): Promise<string>;
}

const dependencies: BootstrapDependencies = {
  async connect(uri) {
    await mongoose.connect(uri, { autoIndex: false });
  },
  async disconnect() {
    await mongoose.disconnect();
  },
  async withTransaction(callback) {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(
        () => callback(session),
        {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
          readPreference: 'primary',
        }
      );
    } finally {
      await session.endSession();
    }
  },
  async markerExists(session) {
    const marker = await bootstrapCollection().findOne({ _id: BOOTSTRAP_MARKER_ID }, { session });
    return marker !== null;
  },
  async activeAdminExists(session) {
    const privilegedRole = /^(ADMIN|SUPER[_ ]ADMIN)$/i;
    return Boolean(
      await User.findOne({
        role: privilegedRole,
        isActive: true,
        isDeleted: { $ne: true },
      })
        .session(session)
        .select({ _id: 1 })
        .lean()
        .exec()
    );
  },
  async adminRoleExists(session) {
    return Boolean(await Role.findOne({ name: 'ADMIN' }).session(session).select({ _id: 1 }).lean().exec());
  },
  async emailExists(email, session) {
    return Boolean(
      await User.findOne({ email }).session(session).select({ _id: 1 }).lean().exec()
    );
  },
  async insertMarker(session) {
    await bootstrapCollection().insertOne(
      { _id: BOOTSTRAP_MARKER_ID, createdAt: new Date() },
      { session }
    );
  },
  async createAdmin(user, session) {
    await User.create([user], { session });
  },
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  },
};

export async function runAdminBootstrap(
  env: NodeJS.ProcessEnv = process.env,
  deps: BootstrapDependencies = dependencies
): Promise<BootstrapResult> {
  const config = readBootstrapConfig(env);
  const hashedPassword = await deps.hashPassword(config.password);

  await deps.connect(config.uri);
  try {
    return await deps.withTransaction(async (session) => {
      if (await deps.markerExists(session)) return 'already-bootstrapped';
      if (await deps.activeAdminExists(session)) return 'existing-admin';
      if (!(await deps.adminRoleExists(session))) {
        throw new Error('Canonical ADMIN role is missing; bootstrap stopped without creating an account.');
      }
      if (await deps.emailExists(config.email, session)) {
        throw new Error('The configured email already belongs to an account; no account was changed.');
      }

      // The marker's built-in unique _id index serializes concurrent attempts. Both
      // this insert and the User insert are committed or rolled back together.
      await deps.insertMarker(session);
      await deps.createAdmin(
        {
          email: config.email,
          password: hashedPassword,
          firstName: config.firstName,
          role: 'ADMIN',
          isActive: true,
          isDeleted: false,
          isEmailVerified: true,
        },
        session
      );
      return 'created';
    });
  } finally {
    await deps.disconnect();
  }
}

async function main(): Promise<void> {
  const result = await runAdminBootstrap();
  if (result === 'created') console.log('Initial Admin account created.');
  else if (result === 'existing-admin') console.log('An active Admin or Super Admin already exists; no changes made.');
  else console.log('The one-time Admin bootstrap was already used; no changes made.');
}

if (require.main === module) {
  main().catch(() => {
    // Do not print raw driver/configuration errors; they may contain the MongoDB URI.
    console.error('Admin bootstrap failed safely. Check the local configuration and database availability.');
    process.exitCode = 1;
  });
}
