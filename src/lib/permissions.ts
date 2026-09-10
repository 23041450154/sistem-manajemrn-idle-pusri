// Mirror backend constants/permissions.go — single source per stack.
// ponytail: pindah ke fetch /api/permissions kalau role/permis jadi dinamis.
export const PERMS = {
  equipmentRead: "equipment:read",
  equipmentCreate: "equipment:create",
  equipmentUpdate: "equipment:update",
  equipmentDelete: "equipment:delete",
  validationCreate: "validation:create",
  validationUpdate: "validation:update",
  revalidationCreate: "revalidation:create",
  inspectionCreate: "inspection:create",
  inspectionRevise: "inspection:revise",
  repairCreate: "repair:create",
  disposalCreate: "disposal:create",
  disposalRevise: "disposal:revise",
  disposalRead: "disposal:read",
  reuseRequestCreate: "reuse:request:create",
  reuseRequestRead: "reuse:request:read",
  reuseRequestManage: "reuse:request:manage",
  approvalValidation: "approval:validation",
  approvalDisposal: "approval:disposal",
  approvalReuse: "approval:reuse",
  approvalRevalidation: "approval:revalidation",
  adminUserManage: "admin:user:manage",
  adminMasterManage: "admin:master:manage",
  adminAll: "admin:all",
} as const;

export type Permission = (typeof PERMS)[keyof typeof PERMS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMS),
  RENDAL_PEMELIHARAAN: [
    PERMS.equipmentRead, PERMS.equipmentCreate, PERMS.equipmentUpdate, PERMS.equipmentDelete,
    PERMS.disposalCreate, PERMS.disposalRevise, PERMS.disposalRead,
    PERMS.approvalRevalidation, PERMS.reuseRequestRead,
  ],
  INSPEKSI_TEKNIK: [
    PERMS.equipmentRead, PERMS.validationCreate, PERMS.validationUpdate, PERMS.revalidationCreate,
    PERMS.inspectionCreate, PERMS.inspectionRevise,
  ],
  PEMELIHARAAN_LAPANGAN: [PERMS.equipmentRead, PERMS.repairCreate],
  MANAJER_RENDAL: [
    PERMS.equipmentRead, PERMS.disposalRead,
    PERMS.approvalValidation, PERMS.approvalDisposal, PERMS.approvalReuse,
    PERMS.reuseRequestManage,
  ],
  UNIT_KERJA_OPERASI: [PERMS.equipmentRead, PERMS.reuseRequestCreate, PERMS.reuseRequestRead],
};

export function hasPermission(role: string | undefined | null, perm: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role.toUpperCase()];
  if (!perms) return false;
  return perms.includes(perm) || perms.includes(PERMS.adminAll);
}
