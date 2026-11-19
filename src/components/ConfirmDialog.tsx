"use client";

import { useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

type Tone = "primary" | "destructive" | "success";

interface ConfirmDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	/** Konsekuensi konkret dari aksi ini. Maksimal 2 kalimat. */
	description: string;
	/** Label tombol batal, default: "Batal". */
	cancelLabel?: string;
	/** Label tombol konfirmasi, contoh: "Ya, Simpan". */
	confirmLabel?: string;
	/** Label saat proses berjalan, contoh: "Menyimpan...". */
	pendingLabel?: string;
	isPending?: boolean;
	tone?: Tone;
	/** Pesan galat opsional bila mutasi gagal di percobaan sebelumnya. */
	errorMessage?: string | null;
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
	success: {
		iconBg: "bg-[#DCFCE7]",
		iconColor: "text-[#059669]",
		button: "bg-[#059669] hover:bg-[#15803D]",
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
	cancelLabel = "Batal",
	confirmLabel = "Ya, Lanjutkan",
	pendingLabel,
	isPending = false,
	tone = "primary",
	errorMessage,
}: ConfirmDialogProps) {
	useEffect(() => {
		if (!open) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !isPending) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, isPending, onClose]);

	if (!open) return null;

	const toneStyles = TONE_STYLES[tone];
	const Icon = tone === "destructive" ? AlertTriangle : CheckCircle2;

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-[#0F172A]/50"
				onClick={() => !isPending && onClose()}
			/>

			{/* Dialog */}
			<div
				role="alertdialog"
				aria-modal="true"
				aria-label={title}
				className="relative bg-white rounded shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] w-full max-w-md border border-[#E6E8EA] flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
			>
				<div className="flex items-start justify-between gap-3 px-6 py-4 shrink-0 border-b border-[#E6E8EA] bg-white">
					<div className="flex items-center gap-3 min-w-0">
						<div
							className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneStyles.iconBg}`}
						>
							<Icon
								className={`h-5 w-5 ${toneStyles.iconColor}`}
								aria-hidden="true"
							/>
						</div>
						<h3 className="text-[15px] font-bold text-gray-900 leading-snug">
							{title}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						aria-label="Tutup dialog konfirmasi"
						className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
					>
						<X className="h-4 w-4" aria-hidden="true" />
					</button>
				</div>

				<div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto scroll-smooth space-y-3">
					<p className="text-[13px] text-gray-700 leading-relaxed">
						{description}
					</p>

					{errorMessage && (
						<div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-[12px] flex items-start gap-2.5">
							<AlertCircle
								className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
								aria-hidden="true"
							/>
							<div className="flex-1">
								<p className="font-bold text-rose-900">
									Pengajuan belum dapat diproses
								</p>
								<p className="mt-0.5 leading-relaxed">{errorMessage}</p>
							</div>
						</div>
					)}
				</div>

				<div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-[#E6E8EA] bg-gray-50">
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
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
