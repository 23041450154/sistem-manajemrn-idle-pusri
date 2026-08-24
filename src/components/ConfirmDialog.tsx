"use client";

import { X, AlertTriangle, CheckCircle2 } from "lucide-react";

type Tone = "primary" | "destructive";

interface ConfirmDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	/** Konsekuensi konkret dari aksi ini. Maksimal 2 kalimat. */
	description: string;
	/** Label tombol konfirmasi, contoh: "Ya, Simpan". */
	confirmLabel?: string;
	/** Label saat proses berjalan, contoh: "Menyimpan...". */
	pendingLabel?: string;
	isPending?: boolean;
	tone?: Tone;
}

const TONE_STYLES: Record<
	Tone,
	{ iconBg: string; iconColor: string; button: string }
> = {
	primary: {
		iconBg: "bg-[#E8F0FA]",
		iconColor: "text-[#0A356A]",
		button: "bg-[#0A356A] hover:bg-[#0556B3]",
	},
	destructive: {
		iconBg: "bg-red-100",
		iconColor: "text-red-600",
		button: "bg-red-600 hover:bg-red-700",
	},
};

/**
 * Dialog konfirmasi Ya/Tidak untuk aksi yang mengubah data.
 * Dipakai sebelum semua mutasi: simpan, approve, hapus, logout.
 */
export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Ya, Lanjutkan",
	pendingLabel,
	isPending = false,
	tone = "primary",
}: ConfirmDialogProps) {
	if (!open) return null;

	const toneStyles = TONE_STYLES[tone];
	const Icon = tone === "destructive" ? AlertTriangle : CheckCircle2;

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			{/* Dialog */}
			<div
				role="alertdialog"
				aria-modal="true"
				aria-label={title}
				className="relative bg-white rounded shadow-2xl w-full max-w-md mx-4 border border-[#E6E8EA] animate-in fade-in zoom-in-95 duration-200"
			>
				<button
					onClick={onClose}
					aria-label="Tutup"
					className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
				>
					<X className="h-4 w-4" />
				</button>

				<div className="p-6">
					<div className="flex items-start gap-4">
						<div
							className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneStyles.iconBg}`}
						>
							<Icon className={`h-5 w-5 ${toneStyles.iconColor}`} />
						</div>
						<div className="flex-1 pr-6">
							<h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
							<p className="mt-1.5 text-[13px] text-gray-600 leading-relaxed">
								{description}
							</p>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E6E8EA] bg-[#F8FAFC] rounded-b">
					<button
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
					>
						Batal
					</button>
					<button
						onClick={onConfirm}
						disabled={isPending}
						className={`px-4 py-2 text-[13px] font-semibold text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2 ${toneStyles.button}`}
					>
						{isPending && (
							<span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						)}
						{isPending ? (pendingLabel ?? "Memproses...") : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
