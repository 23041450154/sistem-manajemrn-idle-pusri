/**
 * Base URL backend Gin — satu sumber kebenaran untuk semua pemakaian.
 * Urutan fallback dipertahankan dari kode lama agar tidak mengubah behavior:
 * NEXT_PUBLIC_API_URL -> API_URL -> default lokal.
 */
export const API_URL =
 process.env.NEXT_PUBLIC_API_URL ||
 process.env.API_URL ||
 "https://api.testing.naufal.me";
