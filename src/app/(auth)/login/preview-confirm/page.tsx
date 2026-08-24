"use client";

import { useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

/** Halaman preview sementara untuk cek visual ConfirmDialog. Dihapus setelah QA. */
export default function PreviewConfirmPage() {
	const sp = useSearchParams();
	const tone = sp.get("tone") ?? "primary";
	const isDestructive = tone === "destructive";
	const isPending = tone === "pending";

	return (
		<div className="min-h-screen bg-[#F8FAFC]">
			<ConfirmDialog
				open
				onClose={() => {}}
				onConfirm={() => {}}
				title={
					isPending
						? "Catat Perbaikan Selesai?"
						: isDestructive
							? "Keluar dari Aplikasi?"
							: "Kirim Hasil Validasi?"
				}
				description={
					isPending
						? "EQ-PUSRI-003 akan berstatus REPAIR_COMPLETED dan masuk antrean validasi ulang Inspeksi Teknik."
						: isDestructive
							? "Sesi Anda akan diakhiri dan Anda kembali ke halaman login."
							: "Status aset EQ-PUSRI-001 akan diperbarui sesuai hasil pemeriksaan dan diteruskan ke alur persetujuan."
				}
				confirmLabel={
					isPending ? "Ya, Simpan" : isDestructive ? "Ya, Keluar" : "Ya, Kirim"
				}
				tone={isDestructive ? "destructive" : "primary"}
				isPending={isPending}
			/>
		</div>
	);
}
