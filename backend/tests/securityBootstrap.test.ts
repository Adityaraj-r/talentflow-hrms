import { afterEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Role from '../models/Role.model';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import {
  authorizeByMatrix,
  authorizeByMatrixStrict,
  MODULE_KEYS,
} from '../middleware/role.middleware';
import { seedFinanceManagerUser } from '../utils/seedFinanceManagerUser';
import { seedPayrollSampleData } from '../utils/seedPayrollSample';

const originalEnv = {
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  financeEmail: process.env.FINANCE_MANAGER_SEED_EMAIL,
  financePassword: process.env.FINANCE_MANAGER_SEED_PASSWORD,
  seedPayrollSample: process.env.SEED_PAYROLL_SAMPLE,
};

const makeResponse = () => {
  const response: any = {};
  response.status = vi.fn().mockReturnValue(response);
  response.json = vi.fn().mockReturnValue(response);
  return response;
};

afterEach(() => {
  vi.restoreAllMocks();
  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  restore('ACCESS_TOKEN_SECRET', originalEnv.accessTokenSecret);
  restore('JWT_SECRET', originalEnv.jwtSecret);
  restore('FINANCE_MANAGER_SEED_EMAIL', originalEnv.financeEmail);
  restore('FINANCE_MANAGER_SEED_PASSWORD', originalEnv.financePassword);
  restore('SEED_PAYROLL_SAMPLE', originalEnv.seedPayrollSample);
});

describe('preserved authentication and authorization behavior', () => {
  it('rejects inactive users during token authentication', async () => {
    process.env.ACCESS_TOKEN_SECRET = 'local-test-access-secret';
    const token = jwt.sign({ id: 'user-id' }, process.env.ACCESS_TOKEN_SECRET);
    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: 'user-id', isActive: false }),
    } as any);
    const req: any = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
    const res = makeResponse();
    const next = vi.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows or denies module actions from the stored permission map', async () => {
    const role = {
      name: 'HR_MANAGER',
      permissions: new Map([
        ['payroll', { read: true, write: false, delete: false }],
      ]),
    };
    vi.spyOn(Role, 'find').mockResolvedValue([role] as any);
    const req: any = { user: { id: 'u1', email: 'hr@example.test', role: 'HR_MANAGER' } };
    const allowedRes = makeResponse();
    const allowedNext = vi.fn();

    await authorizeByMatrix(MODULE_KEYS.PAYROLL, 'read')(req, allowedRes, allowedNext);
    expect(allowedNext).toHaveBeenCalledOnce();

    const deniedRes = makeResponse();
    const deniedNext = vi.fn();
    await authorizeByMatrix(MODULE_KEYS.PAYROLL, 'write')(req, deniedRes, deniedNext);
    expect(deniedRes.status).toHaveBeenCalledWith(403);
    expect(deniedNext).not.toHaveBeenCalled();
  });

  it('retains Admin matrix bypass but requires explicit permission in strict checks', async () => {
    const find = vi.spyOn(Role, 'find').mockResolvedValue([] as any);
    for (const role of ['ADMIN', 'SUPER_ADMIN']) {
      const req: any = { user: { id: 'a1', email: 'admin@example.test', role } };
      const bypassNext = vi.fn();
      await authorizeByMatrix(MODULE_KEYS.SETTINGS, 'write')(req, makeResponse(), bypassNext);
      expect(bypassNext).toHaveBeenCalledOnce();
    }
    expect(find).not.toHaveBeenCalled();

    for (const role of ['ADMIN', 'SUPER_ADMIN']) {
      const req: any = { user: { id: 'a1', email: 'admin@example.test', role } };
      const strictRes = makeResponse();
      const strictNext = vi.fn();
      await authorizeByMatrixStrict(MODULE_KEYS.PERFORMANCE, 'read')(req, strictRes, strictNext);
      expect(strictRes.status).toHaveBeenCalledWith(403);
      expect(strictNext).not.toHaveBeenCalled();
    }
  });

  it('keeps public registration disabled', async () => {
    const res = makeResponse();

    await AuthController.register({} as any, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('safe development seed defaults', () => {
  it('does not create a Finance Manager without explicit credentials', async () => {
    delete process.env.FINANCE_MANAGER_SEED_EMAIL;
    delete process.env.FINANCE_MANAGER_SEED_PASSWORD;
    const findOne = vi.spyOn(User, 'findOne');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await seedFinanceManagerUser();

    expect(findOne).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
  });

  it('does not seed payroll data unless explicitly opted in', async () => {
    delete process.env.SEED_PAYROLL_SAMPLE;
    const find = vi.spyOn(User, 'find');

    await seedPayrollSampleData();

    expect(find).not.toHaveBeenCalled();
  });
});
