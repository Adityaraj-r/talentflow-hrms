import { describe, it, expect } from 'vitest';
import { validatePermissionsPayload, validateModuleKeys } from '../utils/permissions.util';

describe('validatePermissionsPayload', () => {
  it('rejects invalid structures', () => {
    expect(validatePermissionsPayload(null)).toBe(false);
    expect(validatePermissionsPayload({ a: { read: true } })).toBe(false);
  });

  it('accepts valid permission maps', () => {
    const p = { settings: { read: true, write: false, delete: false } };
    expect(validatePermissionsPayload(p)).toBe(true);
    expect(validateModuleKeys(p).ok).toBe(true);
  });

  it('rejects unknown module keys', () => {
    const p = { not_a_module: { read: true, write: false, delete: false } };
    expect(validateModuleKeys(p).ok).toBe(false);
  });
});
