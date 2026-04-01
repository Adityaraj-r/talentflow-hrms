import { ROLES } from './roles';

export const EC_PERMISSIONS = {

  allEmployees: {
    canView:   [ROLES.CEO, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER],
    scope: {
      [ROLES.CEO]:         'organization',
      [ROLES.ADMIN]:       'organization',
      [ROLES.HR_MANAGER]:  'organization',
      [ROLES.HR_OFFICER]:  'organization',
      [ROLES.EMPLOYEE]:    'self',         
    },
  },

  onboarding: {
    canView:     [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER],
    canCreate:   [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER],  
    canGenerate: [ROLES.ADMIN, ROLES.HR_MANAGER],                    
  },

 transfers: {
    canView:     [ROLES.CEO, ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_OFFICER],
    canInitiate: [ROLES.EMPLOYEE],                                   
    canApprove:  [ROLES.ADMIN],
    canOverride: [ROLES.CEO],                                     
    canViewSelf: [ROLES.EMPLOYEE],                                   
  },

  digitalLocker: {
    canView:   [ROLES.CEO, ROLES.ADMIN, ROLES.HR_MANAGER],
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