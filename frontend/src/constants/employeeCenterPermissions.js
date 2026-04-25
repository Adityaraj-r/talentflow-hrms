import { ROLES } from './roles';

export const EC_PERMISSIONS = {
  allEmployees: {
    canView: [ROLES.CEO, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER, ROLES.DEPARTMENT_MANAGER,ROLES.DIRECT_MANAGER],
    scope: {
      [ROLES.CEO]: 'organization',
      [ROLES.ADMIN]: 'organization',
      [ROLES.HR_MANAGER]: 'organization',
      [ROLES.HR_OFFICER]: 'organization',
      [ROLES.DEPARTMENT_MANAGER]: 'department',
      [ROLES.DIRECT_MANAGER]: 'direct_reports',
      [ROLES.EMPLOYEE]: 'self',         
    },
  },
  onboarding: {
    canView: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER, ROLES.DEPARTMENT_MANAGER],
    canCreate: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER],  
    canGenerate: [ROLES.ADMIN, ROLES.HR_MANAGER],                    
  },
  transfers: {
    canView: [ROLES.CEO, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER, ROLES.DEPARTMENT_MANAGER,ROLES.DIRECT_MANAGER],
    canInitiate: [ROLES.EMPLOYEE, ROLES.DIRECT_MANAGER],                                   
    canApprove: [ROLES.ADMIN, ROLES.DEPARTMENT_MANAGER],
    canOverride: [ROLES.CEO],                                     
    canViewSelf: [ROLES.EMPLOYEE],                                   
  },
  digitalLocker: {
    canView: [ROLES.CEO, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.DEPARTMENT_MANAGER],
    canViewSelf: [ROLES.EMPLOYEE, ROLES.HR_OFFICER],
    canUpload: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER, ROLES.EMPLOYEE],
    canVerify: [ROLES.ADMIN, ROLES.HR_MANAGER],
    canDelete: [ROLES.ADMIN],
  },
};

export const hasECAccess = (role, submodule, action) => {
  const mod = EC_PERMISSIONS[submodule];
  if (!mod) return false;
  const allowed = mod[action];
  if (!allowed) return false;
  return allowed.includes(role);
};

export const getDirectoryScope = (role) =>
  EC_PERMISSIONS.allEmployees.scope[role] ?? 'none';