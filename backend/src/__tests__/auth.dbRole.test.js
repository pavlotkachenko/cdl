/**
 * Unit tests for BUG-004 from HARD_BUGS_REGISTRY.md
 *
 * BUG-004: The database `user_role` enum only allows [driver, attorney, admin, operator].
 *          The API accepts 5 roles (driver, carrier, attorney, admin, paralegal).
 *          `dbRole()` must map every API role to a valid DB enum value.
 *
 * These tests do NOT require Supabase — they test the pure mapping function.
 */

const { _testExports } = require('../controllers/auth.controller');
const { dbRole, VALID_DB_ROLES } = _testExports;

describe('BUG-004: dbRole() maps every API role to a valid DB enum', () => {
  // All roles that the API accepts (from RegisterData interface and docs)
  const API_ROLES = ['driver', 'carrier', 'attorney', 'admin', 'paralegal'];

  test.each(API_ROLES)('dbRole("%s") should return a value in VALID_DB_ROLES', (role) => {
    const mapped = dbRole(role);
    expect(VALID_DB_ROLES).toContain(mapped);
  });

  test('carrier maps to carrier (identity)', () => {
    expect(dbRole('carrier')).toBe('carrier');
  });

  test('paralegal maps to operator', () => {
    expect(dbRole('paralegal')).toBe('operator');
  });

  test('driver maps to driver (identity)', () => {
    expect(dbRole('driver')).toBe('driver');
  });

  test('attorney maps to attorney (identity)', () => {
    expect(dbRole('attorney')).toBe('attorney');
  });

  test('admin maps to admin (identity)', () => {
    expect(dbRole('admin')).toBe('admin');
  });

  test('operator maps to operator (identity)', () => {
    expect(dbRole('operator')).toBe('operator');
  });

  test('unknown role defaults to driver', () => {
    expect(dbRole('superadmin')).toBe('driver');
    expect(dbRole('')).toBe('driver');
    expect(dbRole(undefined)).toBe('driver');
    expect(dbRole(null)).toBe('driver');
  });

  test('VALID_DB_ROLES matches the actual PostgreSQL enum', () => {
    // If the DB enum changes, this test must be updated.
    // Current known values (from Supabase migration):
    expect(VALID_DB_ROLES).toEqual(['driver', 'carrier', 'attorney', 'admin', 'operator']);
  });
});
