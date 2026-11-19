import { BASE_PATH } from "./base-path";

// Sumber kebenaran tunggal untuk role aplikasi.
// Semua role berasal dari backend dan ditulis UPPERCASE.

export const ROLES = [
  "ADMIN",
  "RENDAL_PEMELIHARAAN",
  "PEMELIHARAAN_LAPANGAN",
  "INSPEKSI_TEKNIK",
  "MANAJER_RENDAL",
  "UNIT_KERJA_OPERASI",
] as const;

export type Role = (typeof ROLES)[number];

// Role default: Unit Kerja Operasi adalah user sebenarnya, jadi role apa pun
// yang tidak dikenali diperlakukan sebagai role ini.
export const DEFAULT_ROLE: Role = "UNIT_KERJA_OPERASI";

// Pemetaan ketat prefix rute ke satu Role pemilik menu (RBAC).
export const ROLE_ROUTE_PREFIX: Record<string, Role> = {
  "/admin": "ADMIN",
  "/rendal": "RENDAL_PEMELIHARAAN",
  "/pemeliharaan": "PEMELIHARAAN_LAPANGAN",
  "/inspeksi": "INSPEKSI_TEKNIK",
  "/manajer": "MANAJER_RENDAL",
  "/unit-kerja": "UNIT_KERJA_OPERASI",
};

// Halaman utama (landing) tiap role. Dipakai untuk redirect setelah login.
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  RENDAL_PEMELIHARAAN: "/rendal/dashboard",
  PEMELIHARAAN_LAPANGAN: "/pemeliharaan/dashboard",
  INSPEKSI_TEKNIK: "/inspeksi/dashboard",
  MANAJER_RENDAL: "/manajer/dashboard",
  UNIT_KERJA_OPERASI: "/unit-kerja/dashboard",
};

// Label yang ramah dibaca untuk ditampilkan di UI (Header, dsb).
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  RENDAL_PEMELIHARAAN: "Rendal Pemeliharaan",
  PEMELIHARAAN_LAPANGAN: "Pemeliharaan Lapangan",
  INSPEKSI_TEKNIK: "Inspeksi Teknik",
  MANAJER_RENDAL: "Manajer Rendal",
  UNIT_KERJA_OPERASI: "Unit Kerja Operasi",
};

// Cek apakah string merupakan Role aplikasi yang terdaftar.
export function isValidRole(role?: string | null): role is Role {
  if (!role) return false;
  return (ROLES as readonly string[]).includes(role.toUpperCase());
}

// Normalisasi string role sembarang menjadi Role yang valid.
// Role yang tidak dikenali diperlakukan sebagai DEFAULT_ROLE (Unit Kerja Operasi).
export function normalizeRole(role?: string | null): Role {
  if (!role) return DEFAULT_ROLE;
  const upper = role.toUpperCase();
  return isValidRole(upper) ? upper : DEFAULT_ROLE;
}

// Menentukan Role yang berhak mengakses suatu pathname (mendukung path dgn/tanpa basePath).
export function requiredRoleForPath(pathname?: string | null): Role | null {
  if (!pathname) return null;
  let normalized = pathname;
  if (
    BASE_PATH &&
    (normalized === BASE_PATH || normalized.startsWith(BASE_PATH + "/"))
  ) {
    normalized = normalized.slice(BASE_PATH.length) || "/";
  }
  for (const [prefix, role] of Object.entries(ROLE_ROUTE_PREFIX)) {
    if (normalized === prefix || normalized.startsWith(prefix + "/")) {
      return role;
    }
  }
  return null;
}

// Home path untuk role apa pun; fallback ke home DEFAULT_ROLE.
export function homePathForRole(role?: string | null): string {
  return ROLE_HOME[normalizeRole(role)];
}

// Label untuk role apa pun; fallback ke label DEFAULT_ROLE.
export function labelForRole(role?: string | null): string {
  return ROLE_LABEL[normalizeRole(role)];
}
