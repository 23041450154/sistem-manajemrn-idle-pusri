// URL untuk memulai login SSO (top-level redirect ke gateway NEXA).
// Dipakai server (page "/") maupun client (halaman error). NEXT_PUBLIC_* di-inline
// saat build sehingga tersedia di kedua sisi.
export function ssoLoginUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_API_SSO?.replace(/\/+$/, "");
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  if (!base || !clientId) return null;
  return `${base}/api/login?client_id=${encodeURIComponent(clientId)}`;
}
