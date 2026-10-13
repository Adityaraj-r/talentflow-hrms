import { useContext } from 'react';
import { AuthContext }  from '../contexts/AuthContext';
import { hasECAccess, getDirectoryScope } from '../constants/employeeCenterPermissions';

export const useEmployeeCenterAccess = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role;

  return {
    role,

    // All Employees
    canViewDirectory:    hasECAccess(role, 'allEmployees', 'canView'),
    directoryScope:      getDirectoryScope(role),     

    // Onboarding
    canViewOnboarding:   hasECAccess(role, 'onboarding',  'canView'),
    canFillOnboarding:   hasECAccess(role, 'onboarding',  'canCreate'),
    canGenerateEmpId:    hasECAccess(role, 'onboarding',  'canGenerate'),

    // Transfers
    canViewTransfers:    hasECAccess(role, 'transfers',   'canView'),
    canInitiateTransfer: hasECAccess(role, 'transfers',   'canInitiate'),
    canApproveTransfer:  hasECAccess(role, 'transfers',   'canApprove'),
    canOverrideTransfer: hasECAccess(role, 'transfers',   'canOverride'),
    canViewOwnTransfer:  hasECAccess(role, 'transfers',   'canViewSelf'),

    // Digital Locker
    canViewAllDocs:      hasECAccess(role, 'digitalLocker', 'canView'),
    canViewOwnDocs:      hasECAccess(role, 'digitalLocker', 'canViewSelf'),
    canUploadDocs:       hasECAccess(role, 'digitalLocker', 'canUpload'),
    canVerifyDocs:       hasECAccess(role, 'digitalLocker', 'canVerify'),
    canDeleteDocs:       hasECAccess(role, 'digitalLocker', 'canDelete'),

    // Convenience
    userId: user?._id,
    employeeId: user?.employeeId,
  };
};