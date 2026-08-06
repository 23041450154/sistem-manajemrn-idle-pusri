"use client";

export type Role = "ADMIN" | "INSPEKSI" | "MANAGER" | "MANAJER" | "RENDAL" | "OPERASI" | "UNIT_KERJA";

export type ActionType = 
  | "view" 
  | "edit" 
  | "delete" 
  | "validate" 
  | "approve" 
  | "reject" 
  | "perbaikan" 
  | "disposal" 
  | "pinjam";

/**
 * Konfigurasi Hak Akses Akses Berbasis Peran (RBAC)
 * Setiap peran memiliki daftar tindakan yang secara eksplisit diizinkan.
 */
export const ROLE_PERMISSIONS: Record<string, ActionType[]> = {
  ADMIN: ["view", "edit", "delete", "validate", "approve", "reject", "perbaikan", "disposal", "pinjam"],
  INSPEKSI: ["view", "validate"],
  MANAGER: ["view", "approve", "reject"],
  MANAJER: ["view", "approve", "reject"],
  RENDAL: ["view", "perbaikan", "disposal"],
  OPERASI: ["view", "pinjam"],
  UNIT_KERJA: ["view", "pinjam"],
};

/**
 * Memeriksa apakah role tertentu memiliki izin untuk melakukan tindakan (action).
 */
export function hasPermission(role: string | null | undefined, action: ActionType): boolean {
  if (!role) return false;
  const upperRole = role.toUpperCase();
  const allowedActions = ROLE_PERMISSIONS[upperRole] || [];
  return allowedActions.includes(action);
}

/**
 * Mengembalikan seluruh tindakan yang diizinkan untuk role tertentu.
 */
export function getAllowedActions(role: string | null | undefined): ActionType[] {
  if (!role) return [];
  const upperRole = role.toUpperCase();
  return ROLE_PERMISSIONS[upperRole] || [];
}
