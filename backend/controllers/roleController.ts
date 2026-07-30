import { Response } from 'express';
import Role from '../models/Role.model';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { MODULE_KEYS, ModuleKey } from '../middleware/role.middleware';
import { createLog } from './audit.controller';
import { validateModuleKeys, validatePermissionsPayload, PermissionTriple } from '../utils/permissions.util';

function toPermissionsMap(raw: Record<string, { read: boolean; write: boolean; delete: boolean }>) {
  const m = new Map<string, { read: boolean; write: boolean; delete: boolean }>();
  Object.entries(raw).forEach(([k, v]) => {
    m.set(k, { read: !!v.read, write: !!v.write, delete: !!v.delete });
  });
  return m;
}

function defaultPermissions(): Record<string, PermissionTriple> {
  const o: Record<string, PermissionTriple> = {};
  (Object.values(MODULE_KEYS) as ModuleKey[]).forEach((k) => {
    o[k] = { read: false, write: false, delete: false };
  });
  return o;
}

export const getRoles = async (_req: AuthRequest, res: Response) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const { name, permissions: bodyPermissions } = req.body;
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');

    const permissions =
      bodyPermissions && typeof bodyPermissions === 'object' && Object.keys(bodyPermissions).length > 0
        ? bodyPermissions
        : defaultPermissions();

    if (!validatePermissionsPayload(permissions)) {
      return res.status(400).json({ success: false, message: 'Invalid permission structure' });
    }
    const keysCheck = validateModuleKeys(permissions);
    if (!keysCheck.ok) {
      return res.status(400).json({ success: false, message: 'Unknown permission modules', unknown: keysCheck.unknown });
    }

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }

    const newRole = await Role.create({
      name,
      permissions: toPermissionsMap(permissions) as never,
    });

    await createLog(
      req.user?.id || 'system',
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || 'System',
      'CREATE_ROLE',
      'ADMINISTRATION',
      `Created role ${newRole.name}`,
      ip,
      'Success',
      {
        userRole: req.user?.role,
        afterValue: { roleId: newRole._id.toString(), name: newRole.name },
      }
    );

    res.status(201).json({ success: true, role: newRole });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions, name } = req.body;
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const beforeValue = {
      name: role.name,
      permissions: Object.fromEntries(role.permissions || new Map()),
    };

    if (role.isSystemRole && name && name !== role.name) {
       return res.status(403).json({ success: false, message: 'Cannot rename system roles' });
    }

    if (permissions !== undefined) {
      if (!validatePermissionsPayload(permissions)) {
        return res.status(400).json({ success: false, message: 'Invalid permission structure' });
      }
      const keysCheck = validateModuleKeys(permissions);
      if (!keysCheck.ok) {
        return res.status(400).json({ success: false, message: 'Unknown permission modules', unknown: keysCheck.unknown });
      }
      role.permissions = toPermissionsMap(permissions) as never;
    }

    if (name) role.name = name;

    await role.save();

    const afterValue = {
      name: role.name,
      permissions: Object.fromEntries(role.permissions || new Map()),
    };

    await createLog(
      req.user?.id || 'system',
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || 'System',
      'UPDATE_ROLE',
      'ADMINISTRATION',
      `Updated role ${role.name}`,
      ip,
      'Success',
      {
        userRole: req.user?.role,
        beforeValue,
        afterValue,
      }
    );

    res.status(200).json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');

    const role = await Role.findById(id);

    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    if (role.isSystemRole) {
      return res.status(403).json({ success: false, message: 'Cannot delete system roles' });
    }

    const assignedUsersCount = await User.countDocuments({ role: role.name, isDeleted: false });
    if (assignedUsersCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This role is assigned to one or more users. Reassign or remove those users before deleting the role.' 
      });
    }

    const snap = { name: role.name };
    await role.deleteOne();

    await createLog(
      req.user?.id || 'system',
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || 'System',
      'DELETE_ROLE',
      'ADMINISTRATION',
      `Deleted role ${snap.name}`,
      ip,
      'Success',
      { userRole: req.user?.role, beforeValue: snap }
    );

    res.status(200).json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error });
  }
};
