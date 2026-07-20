// Sumber kebenaran tunggal untuk role aplikasi.
// Semua role berasal dari backend dan ditulis UPPERCASE.

export const ROLES = [
  "ADMIN",
  "RENDAL_PEMELIHARAAN",
  "INSPEKSI_TEKNIK",
  "MANAJER_RENDAL",
  "UNIT_KERJA_OPERASI",
] as const;

export type Role = (typeof ROLES)[number];

// Role default: Unit Kerja Operasi adalah user sebenarnya, jadi role apa pun
// yang tidak dikenali diperlakukan sebagai role ini.
export const DEFAULT_ROLE: Role = "UNIT_KERJA_OPERASI";

// Halaman utama (landing) tiap role. Dipakai untuk redirect setelah login
// dan sebagai tujuan fallback ketika role mengakses rute yang bukan miliknya.
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  RENDAL_PEMELIHARAAN: "/rendal/dashboard",
  INSPEKSI_TEKNIK: "/inspeksi/dashboard",
  MANAJER_RENDAL: "/manajer/dashboard",
  UNIT_KERJA_OPERASI: "/unit-kerja/dashboard",
};

// Label yang ramah dibaca untuk ditampilkan di UI (Header, dsb).
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  RENDAL_PEMELIHARAAN: "Rendal Pemeliharaan",
  INSPEKSI_TEKNIK: "Inspeksi Teknik",
  MANAJER_RENDAL: "Manajer Rendal",
  UNIT_KERJA_OPERASI: "Unit Kerja Operasi",
};

// Normalisasi string role sembarang menjadi Role yang valid.
// Role yang tidak dikenali diperlakukan sebagai DEFAULT_ROLE (Unit Kerja Operasi).
export function normalizeRole(role?: string | null): Role {
  if (!role) return DEFAULT_ROLE;
  const upper = role.toUpperCase();
  return (ROLES as readonly string[]).includes(upper)
    ? (upper as Role)
    : DEFAULT_ROLE;
}

// Home path untuk role apa pun; fallback ke home DEFAULT_ROLE.
export function homePathForRole(role?: string | null): string {
  return ROLE_HOME[normalizeRole(role)];
}

// Label untuk role apa pun; fallback ke label DEFAULT_ROLE.
export function labelForRole(role?: string | null): string {
  return ROLE_LABEL[normalizeRole(role)];
}
