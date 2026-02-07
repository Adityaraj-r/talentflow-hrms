import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface IRole extends Document {
  name: string;
  permissions: Map<string, IPermission>; // key = module name (e.g., "employees")
  isSystemRole?: boolean; // To prevent deleting Admin/Employee default roles
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  permissions: {
    type: Map,
    of: new Schema({
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    }, { _id: false }),
    default: {}
  },
  isSystemRole: { type: Boolean, default: false },
}, {
  timestamps: true
});

export default mongoose.model<IRole>('Role', RoleSchema);