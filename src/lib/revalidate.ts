/**
 * SPA: tidak ada Router Cache di server yang bisa di-revalidate dari browser
 * (revalidatePath server-only). Data di-fetch no-store dan komponen memuat
 * ulang sendiri setelah mutasi. Dipertahankan sebagai no-op agar seluruh
 * pemanggil lama tetap kompilasi tanpa diubah.
 */
export function revalidateApp() {}
