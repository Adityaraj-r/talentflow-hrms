import apiClient from './apiClient';

let cache = { permissions: null, role: null };

export const getMyPermissions = async (userRole) => {
  if (cache.permissions && cache.role === userRole) {
    return cache.permissions;
  }
  try {
    const response = await apiClient.get('/roles');
    const roles = response.data?.roles || [];
    const roleDoc = roles.find(
      r => r.name?.toUpperCase() === userRole?.toUpperCase()
    );
    const permissions = roleDoc?.permissions || {};
    cache = { permissions, role: userRole };
    return permissions;
  } catch (err) {
    console.error('[permissionService] Failed to fetch permissions:', err);
    return {};
  }
};

export const clearPermissionCache = () => {
  cache = { permissions: null, role: null };
};

// action: 'read' | 'write' | 'delete'
export const can = (permissions, moduleKey, action) => {
  if (!permissions || !moduleKey) return false;
  const perm = permissions[moduleKey];
  return !!perm?.[action];
};

export const MODULES = {
  DASHBOARD:   'dashboard',
  EMPLOYEES:   'employees',
  RECRUITMENT: 'recruitment',
  PAYROLL:     'payroll',
  ATTENDANCE:  'attendance',
  SETTINGS:    'settings',
  ROLES:       'roles',
};
