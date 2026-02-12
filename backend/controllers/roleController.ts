import { Request, Response } from 'express';
import Role from '../models/Role.model';

// 1. Get All Roles 
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// 2. Create a New Role 
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;
    
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }

    const newRole = await Role.create({ name, permissions });
    res.status(201).json({ success: true, role: newRole });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};

// 3. Update Permissions 
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions, name } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Prevent renaming system roles 
    if (role.isSystemRole && name && name !== role.name) {
       return res.status(403).json({ success: false, message: 'Cannot rename system roles' });
    }

    if (name) role.name = name;
    if (permissions) role.permissions = permissions;

    await role.save();
    res.status(200).json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error });
  }
};

// 4. Delete Role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    if (role.isSystemRole) {
      return res.status(403).json({ success: false, message: 'Cannot delete system roles' });
    }

    await role.deleteOne();
    res.status(200).json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error });
  }
};