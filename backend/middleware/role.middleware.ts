import { Request, Response, NextFunction } from 'express';
import Role from '../models/Role.model';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';

export const ROLES = {
  CEO: 'CEO',
  COUNTRY_MANAGER: 'COUNTRY_MANAGER',
  HR_MANAGER: 'HR_MANAGER',
  HR_OFFICER: 'HR_OFFICER',
  DEPARTMENT_MANAGER: 'DEPARTMENT_MANAGER',
  DIRECT_MANAGER: 'DIRECT_MANAGER',
  PAYROLL_OFFICER: 'PAYROLL_OFFICER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  CAMP_BOSS: 'CAMP_BOSS',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
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

export type ModuleKey = typeof MODULE_KEYS[keyof typeof MODULE_KEYS];
export type PermissionAction = 'read' | 'write' | 'delete';

const ADMIN_ROLES = ['ADMIN', 'SUPER ADMIN', 'Super Admin'];

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return;
    }
    const userRole = req.user.role?.toUpperCase?.() || req.user.role;
    const normalized = allowedRoles.map(r => r.toUpperCase());

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

    const userRole = req.user.role;

    if (ADMIN_ROLES.includes(userRole)) {
      next();
      return;
    }

    try {
      const roleDoc = await Role.findOne({ name: userRole });

      if (!roleDoc) {
        logger.warn(`[MATRIX] Role not found: "${userRole}" for ${req.user.email}`);
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
