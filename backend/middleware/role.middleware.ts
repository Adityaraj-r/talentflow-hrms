import { Request, Response, NextFunction } from 'express';
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

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'User not authenticated');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}`);
      ResponseHandler.forbidden(res, 'You do not have permission to access this resource');
      return;
    }

    next();
  };
};
