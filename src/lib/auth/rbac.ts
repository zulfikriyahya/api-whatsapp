// src/lib/auth/rbac.ts
import { UserRole } from "@/types/database.types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.DST]: 80,
  [UserRole.USER_A]: 60,
  [UserRole.USER_B]: 40,
  [UserRole.USER_C]: 20,
};

export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_ALL_DEVICES: "manage_all_devices",
  MANAGE_OWN_DEVICES: "manage_own_devices",
  SEND_MESSAGES: "send_messages",
  VIEW_STATS: "view_stats",
  VIEW_ALL_STATS: "view_all_stats",
  MANAGE_API_KEYS: "manage_api_keys",
  MANAGE_WEBHOOKS: "manage_webhooks",
  BACKUP_RESTORE: "backup_restore",
  VIEW_AUDIT_LOGS: "view_audit_logs",
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_ALL_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.BACKUP_RESTORE,
    PERMISSIONS.VIEW_AUDIT_LOGS,
  ],
  [UserRole.DST]: [
    PERMISSIONS.MANAGE_ALL_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_ALL_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
    PERMISSIONS.MANAGE_WEBHOOKS,
  ],
  [UserRole.USER_A]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_STATS,
    PERMISSIONS.MANAGE_API_KEYS,
  ],
  [UserRole.USER_B]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_STATS,
  ],
  [UserRole.USER_C]: [
    PERMISSIONS.MANAGE_OWN_DEVICES,
    PERMISSIONS.SEND_MESSAGES,
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessResource(
  userRole: UserRole,
  ownerId: string,
  userId: string,
): boolean {
  if (userRole === UserRole.ADMIN || userRole === UserRole.DST) {
    return true;
  }
  return ownerId === userId;
}
