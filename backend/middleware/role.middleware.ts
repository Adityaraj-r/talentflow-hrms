import { Request, Response, NextFunction } from 'express';
import Role from '../models/Role.model';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';

export const ROLES = {
  SUPER_ADMIN:      'SUPER_ADMIN',
  CEO:               'CEO',
  COUNTRY_MANAGER:   'COUNTRY_MANAGER',
  FINANCE_MANAGER:   'FINANCE_MANAGER',
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
  AUDIT:       'audit',
  /** Performance Management System — Admin/Super Admin must NOT bypass matrix (use authorizeByMatrixStrict). */
  PERFORMANCE: 'performance',
} as const;

export type ModuleKey       = typeof MODULE_KEYS[keyof typeof MODULE_KEYS];
export type PermissionAction = 'read' | 'write' | 'delete';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const normalizeRole = (str: string | undefined): string => {
  if (!str) return '';
  return str.toUpperCase().replace(/[\s_]/g, "");
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return;
    }
    
    const userRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map(normalizeRole);

    if (!normalizedAllowed.includes(userRole)) {
      logger.warn(`Access denied: ${req.user.email} (${userRole})`);
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

    const rawUserRole = req.user.role;
    const normalizedUserRole = normalizeRole(rawUserRole);

    if (ADMIN_ROLES.some(role => normalizeRole(role) === normalizedUserRole)) {
      next();
      return;
    }

    try {
      const roles = await Role.find({});
      const roleDoc = roles.find(r => normalizeRole(r.name) === normalizedUserRole);

      if (!roleDoc) {
        logger.warn(`Role not found in permission map: "${rawUserRole}" (${req.user.email})`);
        ResponseHandler.forbidden(res, 'Role configuration not found');
        return;
      }

      const permission = roleDoc.permissions.get(module);

      if (!permission || !permission[action]) {
        logger.warn(
          `Permission denied: ${req.user.email} (${rawUserRole}) — ${action} on "${module}"`
        );
        ResponseHandler.forbidden(
          res,
          `Access denied: your role does not have ${action} permission on ${module}`
        );
        return;
      }

      next();
    } catch (err) {
      logger.error(`Permission check error for ${req.user.email}: ${err}`);
      ResponseHandler.serverError(res, 'Permission check failed');
    }
  };
};

/**
 * Same as authorizeByMatrix but never grants access via Admin/Super Admin bypass.
 * Use for PMS routes so system admins cannot access Performance data without explicit DB permissions.
 */
export const authorizeByMatrixStrict = (module: ModuleKey, action: PermissionAction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return;
    }

    const rawUserRole = req.user.role;
    const normalizedUserRole = normalizeRole(rawUserRole);

    try {
      const roles = await Role.find({});
      const roleDoc = roles.find(r => normalizeRole(r.name) === normalizedUserRole);

      if (!roleDoc) {
        logger.warn(`Role not found in permission map: "${rawUserRole}" (${req.user.email})`);
        ResponseHandler.forbidden(res, 'Role configuration not found');
        return;
      }

      const permission = roleDoc.permissions.get(module);

      if (!permission || !permission[action]) {
        logger.warn(
          `Permission denied (strict): ${req.user.email} (${rawUserRole}) — ${action} on "${module}"`
        );
        ResponseHandler.forbidden(
          res,
          `Access denied: your role does not have ${action} permission on ${module}`
        );
        return;
      }

      next();
    } catch (err) {
      logger.error(`Strict permission check error for ${req.user.email}: ${err}`);
      ResponseHandler.serverError(res, 'Permission check failed');
    }
  };
};

export const authorizeByMatrixAny = (
  checks: { module: ModuleKey; action: PermissionAction }[]
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return;
    }

    const rawUserRole = req.user.role;
    const normalizedUserRole = normalizeRole(rawUserRole);

    if (ADMIN_ROLES.some(role => normalizeRole(role) === normalizedUserRole)) {
      next();
      return;
    }

    try {
      const roles = await Role.find({});
      const roleDoc = roles.find(r => normalizeRole(r.name) === normalizedUserRole);

      if (!roleDoc) {
        logger.warn(`Role not found in permission map: "${rawUserRole}" (${req.user.email})`);
        ResponseHandler.forbidden(res, 'Role configuration not found');
        return;
      }

      const allowed = checks.some(({ module, action }) => {
        const permission = roleDoc.permissions.get(module);
        return permission && permission[action];
      });

      if (!allowed) {
        logger.warn(
          `Permission denied (alternate modules): ${req.user.email} (${rawUserRole}) — ${checks.map(c => `${c.action}:${c.module}`).join(', ')}`
        );
        ResponseHandler.forbidden(res, 'Access denied for this resource');
        return;
      }

      next();
    } catch (err) {
      logger.error(`Permission check error for ${req.user.email}: ${err}`);
      ResponseHandler.serverError(res, 'Permission check failed');
    }
  };
};
