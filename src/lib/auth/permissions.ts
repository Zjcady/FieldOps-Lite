/**
 * Role-based permission system.
 * Roles are ordered by privilege level (highest first).
 */

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 100,
  ops_manager: 80,
  dispatcher: 60,
  crew_leader: 40,
  crew_member: 20,
  subcontractor: 10,
  customer: 0,
};

type Permission =
  | "jobs:read"
  | "jobs:write"
  | "jobs:delete"
  | "crews:read"
  | "crews:write"
  | "customers:read"
  | "customers:write"
  | "permits:read"
  | "permits:write"
  | "reports:read"
  | "invoices:read"
  | "invoices:write"
  | "company:manage"
  | "photos:upload"
  | "outreach:manage";

const PERMISSION_REQUIREMENTS: Record<Permission, number> = {
  "jobs:read": 20,
  "jobs:write": 60,
  "jobs:delete": 80,
  "crews:read": 20,
  "crews:write": 80,
  "customers:read": 40,
  "customers:write": 60,
  "permits:read": 20,
  "permits:write": 60,
  "reports:read": 40,
  "invoices:read": 60,
  "invoices:write": 80,
  "company:manage": 100,
  "photos:upload": 20,
  "outreach:manage": 80,
};

export function hasPermission(role: string, permission: Permission): boolean {
  const userLevel = ROLE_HIERARCHY[role] ?? 0;
  const required = PERMISSION_REQUIREMENTS[permission] ?? 100;
  return userLevel >= required;
}

export function hasMinRole(role: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 100);
}
