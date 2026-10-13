import { afterEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { readBootstrapConfig, runAdminBootstrap } from '../scripts/bootstrapInitialAdmin';

const VALID_URI = 'mongodb+srv://local-user:local-pass@cluster0.7qgx73w.mongodb.net/talentflow?retryWrites=true&w=majority';
const PASSWORD = 'StrongLocalPassword-123!';

function env(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    MONGODB_URI: VALID_URI,
    INITIAL_ADMIN_EMAIL: 'owner@example.test',
    INITIAL_ADMIN_PASSWORD: PASSWORD,
    INITIAL_ADMIN_FIRST_NAME: 'Owner',
    NODE_ENV: 'development',
    ...overrides,
  };
}

function fakeDependencies(overrides: Record<string, unknown> = {}) {
  const state = {
    marker: false,
    admin: false,
    role: true,
    emailExists: false,
    users: [] as Record<string, unknown>[],
  };
  let transactionTail = Promise.resolve();
  const deps = {
    connect: vi.fn(async (_uri: string) => undefined),
    disconnect: vi.fn(async () => undefined),
    withTransaction: vi.fn(async (callback: (session: any) => Promise<unknown>) => {
      // Serialize mock transactions to exercise the same unique-claim outcome
      // expected from the database transaction and marker _id constraint.
      let release!: () => void;
      const previous = transactionTail;
      transactionTail = new Promise<void>((resolve) => (release = resolve));
      await previous;
      try {
        return await callback({ id: 'transaction-session' });
      } finally {
        release();
      }
    }),
    markerExists: vi.fn(async () => state.marker),
    activeAdminExists: vi.fn(async () => state.admin),
    adminRoleExists: vi.fn(async () => state.role),
    emailExists: vi.fn(async () => state.emailExists),
    insertMarker: vi.fn(async () => {
      if (state.marker) throw Object.assign(new Error('duplicate'), { code: 11000 });
      state.marker = true;
    }),
    createAdmin: vi.fn(async (user: Record<string, unknown>) => {
      state.users.push(user);
      state.admin = true;
    }),
    hashPassword: vi.fn(async (password: string) => bcrypt.hash(password, await bcrypt.genSalt(4))),
    state,
    ...overrides,
  };
  return deps;
}

afterEach(() => vi.restoreAllMocks());

describe('initial Admin bootstrap', () => {
  it('creates a hashed Admin only in the approved Atlas database', async () => {
    const deps = fakeDependencies();
    const result = await runAdminBootstrap(env(), deps as any);

    expect(result).toBe('created');
    expect(deps.connect).toHaveBeenCalledWith(VALID_URI);
    expect(deps.insertMarker).toHaveBeenCalledOnce();
    expect(deps.createAdmin).toHaveBeenCalledOnce();
    expect(deps.state.users[0]).toMatchObject({
      email: 'owner@example.test',
      password: expect.any(String),
      role: 'ADMIN',
      isActive: true,
      isDeleted: false,
      isEmailVerified: true,
    });
    expect(deps.state.users[0].password).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, String(deps.state.users[0].password))).toBe(true);
  });

  it('does not create or reset an account on repeated execution', async () => {
    const deps = fakeDependencies();
    await runAdminBootstrap(env(), deps as any);
    const original = { ...deps.state.users[0] };
    const result = await runAdminBootstrap(env({ INITIAL_ADMIN_PASSWORD: 'DifferentPassword-456!' }), deps as any);

    expect(result).toBe('already-bootstrapped');
    expect(deps.createAdmin).toHaveBeenCalledOnce();
    expect(deps.state.users[0]).toEqual(original);
  });

  it('stops when any active Admin or Super Admin already exists', async () => {
    const deps = fakeDependencies();
    deps.state.admin = true;

    const result = await runAdminBootstrap(env(), deps as any);

    expect(result).toBe('existing-admin');
    expect(deps.insertMarker).not.toHaveBeenCalled();
    expect(deps.createAdmin).not.toHaveBeenCalled();
  });

  it.each([
    ['wrong host', { MONGODB_URI: VALID_URI.replace('cluster0.7qgx73w.mongodb.net', 'company.example.net') }],
    ['wrong database', { MONGODB_URI: VALID_URI.replace('/talentflow?', '/company?') }],
    ['conflicting database override', { MONGODB_URI: `${VALID_URI}&dbName=company` }],
    ['duplicate database override', { MONGODB_URI: `${VALID_URI}&dbName=talentflow&dbName=company` }],
    ['production environment', { NODE_ENV: 'production' }],
    ['missing email', { INITIAL_ADMIN_EMAIL: '' }],
    ['weak password', { INITIAL_ADMIN_PASSWORD: 'too-short' }],
  ])('rejects %s before connecting', async (_label, override) => {
    const deps = fakeDependencies();

    await expect(runAdminBootstrap(env(override), deps as any)).rejects.toThrow();

    expect(deps.connect).not.toHaveBeenCalled();
    expect(deps.insertMarker).not.toHaveBeenCalled();
    expect(deps.createAdmin).not.toHaveBeenCalled();
  });

  it('does not elevate an existing non-admin account that uses the requested email', async () => {
    const deps = fakeDependencies();
    deps.state.emailExists = true;

    await expect(runAdminBootstrap(env(), deps as any)).rejects.toThrow(/already belongs/);

    expect(deps.insertMarker).not.toHaveBeenCalled();
    expect(deps.createAdmin).not.toHaveBeenCalled();
  });

  it('fails without creating a user if transaction or marker atomicity fails', async () => {
    const deps = fakeDependencies({
      withTransaction: vi.fn(async () => {
        throw new Error('transaction unsupported');
      }),
    });

    await expect(runAdminBootstrap(env(), deps as any)).rejects.toThrow('transaction unsupported');

    expect(deps.createAdmin).not.toHaveBeenCalled();
  });

  it('permits only one creator when two executions race', async () => {
    const deps = fakeDependencies();
    const results = await Promise.all([
      runAdminBootstrap(env(), deps as any),
      runAdminBootstrap(env(), deps as any),
    ]);

    expect(results.filter((result) => result === 'created')).toHaveLength(1);
    expect(results).toContain('already-bootstrapped');
    expect(deps.createAdmin).toHaveBeenCalledOnce();
  });
});
