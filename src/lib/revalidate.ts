import { revalidatePath } from "next/cache";

/**
 * Invalidasi router cache seluruh aplikasi setelah mutasi status aset/approval.
 *
 * Dipakai luas (bukan per-path) karena status satu aset tampil di dashboard
 * semua role; untuk aplikasi internal ini kebenaran data > efisiensi cache.
 * Fetch data memakai no-store, jadi yang direfresh terutama Router Cache
 * client-side saat navigasi back/antarpindah halaman.
 */
export function revalidateApp() {
 revalidatePath("/", "layout");
}
