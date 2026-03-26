import { Request, Response, NextFunction } from 'express';
import Role from '../models/Role.model';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';


export const ROLES = {
  CEO:                'CEO',
  COUNTRY_MANAGER:    'COUNTRY_MANAGER',
  HR_MANAGER:         'HR_MANAGER',
  HR_OFFICER:         'HR_OFFICER',
  DEPARTMENT_MANAGER: 'DEPARTMENT_MANAGER',
  DIRECT_MANAGER:     'DIRECT_MANAGER',
  PAYROLL_OFFICER:    'PAYROLL_OFFICER',
  PROJECT_MANAGER:    'PROJECT_MANAGER',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  ADMIN:              'ADMIN',
  EMPLOYEE:           'EMPLOYEE',
};


export const MODULE_KEYS = {
  DASHBOARD:   'dashboard',
  EMPLOYEES:   'employees',
  RECRUITMENT: 'recruitment',
  PAYROLL:     'payroll',
  ATTENDANCE:  'attendance',
  SETTINGS:    'settings',
  ROLES:       'roles',
} as const;


export type ModuleKey       = typeof MODULE_KEYS[keyof typeof MODULE_KEYS];
export type PermissionAction = 'read' | 'write' | 'delete';


// FIXED: normalize SUPER ADMIN — previously 'Super Admin' title-case
// would never match DB value 'SUPER ADMIN'
const SUPER_ADMIN_ROLES = ['SUPER ADMIN', 'SUPER_ADMIN'];


export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return;
    }

    // FIXED: normalize both sides to uppercase before comparing
    // Previously userRole was .toUpperCase() but allowedRoles were not,
    // causing 'HR_MANAGER' !== 'hr_manager' mismatches
    const normalizeRole = (role: string) => role.toString().toUpperCase().replace(/\s+/g, '_');
    const userRole = normalizeRole(req.user.role?.toString() || '');
    const normalized = allowedRoles.map(r => normalizeRole(r));

    // SUPER ADMIN always passes
    if (userRole === 'SUPER_ADMIN') {
      next();
      return;
    }

    if (!normalized.includes(userRole)) {
      logger.warn(`[STATIC] Access denied: ${req.user.email} (${userRole})`);
      ResponseHandler.forbidden(res, 'You do not have permission to access this resource');
      return;
    }

    next();
  };
};


export const authorizeByMatrix = (module: ModuleKey, action: PermissionAction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return;
    }

    // Only SUPER ADMIN bypasses the matrix. ADMIN follows DB permissions (e.g. recruitment read-only).
    const userRole = (req.user.role?.toString() || '').toUpperCase();

    if (SUPER_ADMIN_ROLES.includes(userRole)) {
      next();
      return;
    }

    try {
      // FIXED: search by normalized name to handle casing differences
      const roleDoc = await Role.findOne({
        name: { $regex: new RegExp(`^${req.user.role}$`, 'i') }
      });

      if (!roleDoc) {
        logger.warn(`[MATRIX] Role not found: "${req.user.role}" for ${req.user.email}`);
        ResponseHandler.forbidden(res, 'Role configuration not found');
        return;
      }

      const permission = roleDoc.permissions.get(module);

      if (!permission || !permission[action]) {
        logger.warn(
          `[MATRIX] Denied: ${req.user.email} (${userRole}) — ${action} on "${module}"`
        );
        ResponseHandler.forbidden(
          res,
          `Access denied: your role does not have ${action} permission on ${module}`
        );
        return;
      }

      next();
    } catch (err) {
      logger.error(`[MATRIX] Permission check error for ${req.user.email}: ${err}`);
      ResponseHandler.serverError(res, 'Permission check failed');
    }
  };
};
