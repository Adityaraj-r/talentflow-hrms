import { MODULE_KEYS, ModuleKey } from '../middleware/role.middleware';

export type PermissionTriple = { read: boolean; write: boolean; delete: boolean };

export const KNOWN_MODULE_KEYS = new Set<string>(
  Object.values(MODULE_KEYS) as string[]
);

export function validatePermissionsPayload(
  input: unknown
): input is Record<string, PermissionTriple> {
  if (!input || typeof input !== 'object') return false;
  const obj = input as Record<string, unknown>;
  for (const [, v] of Object.entries(obj)) {
    if (!v || typeof v !== 'object') return false;
    const p = v as Record<string, unknown>;
    if (
      typeof p.read !== 'boolean' ||
      typeof p.write !== 'boolean' ||
      typeof p.delete !== 'boolean'
    ) {
      return false;
    }
  }
  return true;
}

export function validateModuleKeys(
  input: Record<string, PermissionTriple>
): { ok: true } | { ok: false; unknown: string[] } {
  const unknown = Object.keys(input).filter((k) => !KNOWN_MODULE_KEYS.has(k));
  if (unknown.length) return { ok: false, unknown };
  return { ok: true };
}

export function isModuleKey(value: string): value is ModuleKey {
  return KNOWN_MODULE_KEYS.has(value);
}
