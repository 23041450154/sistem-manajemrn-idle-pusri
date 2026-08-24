"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, X, Loader2, AlertCircle } from "lucide-react";
import { createReuseRequest } from "@/action/api";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface KatalogItemMinimal {
	id: string;
	code: string;
	name: string;
	plant: string;
	objectType: string;
	estimatedReuseValue?: number;
}

export default function RequestModalButton({ eq }: { eq: KatalogItemMinimal }) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const today = new Date().toISOString().split("T")[0];

	const [formData, setFormData] = useState({
		target_plant: eq.plant || "Plant PUSRI IB",
		installation_location: "Area Pabrik Utama",
		start_date: today,
		end_date: "",
		justification:
			"Diperlukan untuk memperlancar operasional dan efisiensi unit kerja.",
		estimated_cost_avoidance: eq.estimatedReuseValue || 150000000,
		contact_person: "Budi Santoso",
		contact_npp: "100002",
		contact_phone: "0812-7890-1122",
	});

	const handleOpen = () => {
		setError(null);
		setIsOpen(true);
	};

	const handleClose = () => {
		if (isSubmitting) return;
		setIsOpen(false);
		setError(null);
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (isSubmitting) return;

		if (!formData.installation_location.trim()) {
			setError("Lokasi pemasangan / penggunaan wajib diisi.");
			return;
		}

		if (!formData.justification.trim()) {
			setError("Alasan kebutuhan / justifikasi wajib diisi.");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const reqNumber = `REQ-REUSE-${Date.now().toString().slice(-6)}`;
			const result = await createReuseRequest({
				equipment_id: eq.id,
				request_number: reqNumber,
				target_plant: formData.target_plant,
				installation_location: formData.installation_location,
				requesting_unit: formData.installation_location,
				start_date: formData.start_date,
				end_date: formData.end_date || undefined,
				justification: formData.justification,
				estimated_cost_avoidance: Number(formData.estimated_cost_avoidance) || 0,
				contact_person: formData.contact_person,
				contact_npp: formData.contact_npp,
				contact_phone: formData.contact_phone,
			});

			if (result && result.success) {
				setIsOpen(false);
				window.location.href = "/unit-kerja/riwayat-permintaan?submitted=true";
			} else {
				setError(result?.message || "Gagal mengirim pengajuan pemakaian.");
			}
		} catch (err: unknown) {
			console.error("Submit error:", err);
			setError(
				err instanceof Error
					? err.message
					: "Terjadi kesalahan sistem saat mengirim pengajuan.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={handleOpen}
				className="flex h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-[#0A356A] px-4 text-[14px] font-semibold text-white transition-colors duration-140 hover:bg-[#0556B3] focus-visible:ring-2 focus-visible:ring-[#334155] focus-visible:ring-offset-1 focus-visible:outline-none shadow-sm"
			>
				<Send className="w-4 h-4" />
				Ajukan Permintaan Pemakaian
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#0A356A] to-[#0556B3]">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
									<Send className="w-5 h-5 text-white" />
								</div>
								<div>
									<h2 className="text-base font-bold text-white">
										Ajukan Permintaan Pemakaian
									</h2>
									<p className="text-xs text-blue-100">
										{eq.code} — {eq.name}
									</p>
								</div>
							</div>
							<button
								onClick={handleClose}
								disabled={isSubmitting}
								className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Form */}
						<form
							onSubmit={handleSubmit}
							className="px-6 py-5 space-y-4 overflow-y-auto flex-1"
						>
							{error && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-2">
									<AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
									<span>{error}</span>
								</div>
							)}

							{/* Summary Info */}
							<div className="bg-gray-50 rounded-lg p-3 border border-gray-200 grid grid-cols-2 gap-2 text-xs">
								<div>
									<p className="text-gray-500 font-medium">Peralatan</p>
									<p className="text-gray-800 font-semibold truncate">{eq.name}</p>
								</div>
								<div>
									<p className="text-gray-500 font-medium">Kategori</p>
									<p className="text-gray-800 font-semibold">{eq.objectType}</p>
								</div>
							</div>

							{/* Target Plant & Location */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Plant Tujuan <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={formData.target_plant}
										onChange={(e) =>
											setFormData({ ...formData, target_plant: e.target.value })
										}
										required
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Lokasi Pemasangan <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={formData.installation_location}
										onChange={(e) =>
											setFormData({ ...formData, installation_location: e.target.value })
										}
										required
										placeholder="misal: Area Pabrik III"
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
									/>
								</div>
							</div>

							{/* Dates */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Tanggal Mulai Pemakaian <span className="text-red-500">*</span>
									</label>
									<input
										type="date"
										value={formData.start_date}
										onChange={(e) =>
											setFormData({ ...formData, start_date: e.target.value })
										}
										required
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
									/>
								</div>
								<div>
									<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
										Estimasi Cost Avoidance (Rp)
									</label>
									<input
										type="number"
										value={formData.estimated_cost_avoidance}
										onChange={(e) =>
											setFormData({
												...formData,
												estimated_cost_avoidance: Number(e.target.value) || 0,
											})
										}
										className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none"
									/>
								</div>
							</div>

							{/* Justification */}
							<div>
								<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
									Alasan Kebutuhan & Justifikasi <span className="text-red-500">*</span>
								</label>
								<textarea
									value={formData.justification}
									onChange={(e) =>
										setFormData({ ...formData, justification: e.target.value })
									}
									required
									rows={3}
									placeholder="Tuliskan justifikasi pemakaian peralatan ini..."
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none resize-none"
								/>
							</div>

							{/* Contact Person */}
							<div className="bg-gray-50/80 rounded-lg p-3 border border-gray-200 space-y-2">
								<p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
									Kontak Penanggung Jawab
								</p>
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div>
										<span className="text-gray-500">Nama:</span>{" "}
										<strong className="text-gray-800">{formData.contact_person}</strong>
									</div>
									<div>
										<span className="text-gray-500">NPP:</span>{" "}
										<strong className="text-gray-800">{formData.contact_npp}</strong>
									</div>
								</div>
							</div>

							{/* Footer Actions */}
							<div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={handleClose}
									disabled={isSubmitting}
									className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
								>
									Batal
								</button>
								<button
									type="button"
									onClick={() => setIsConfirmOpen(true)}
									disabled={isSubmitting}
									className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0A356A] hover:bg-[#062854] rounded-lg transition-colors disabled:opacity-50 shadow-sm"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
											Mengirim...
										</>
									) : (
										<>
											<Send className="w-3.5 h-3.5" />
											Kirim Pengajuan
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<ConfirmDialog
				open={isConfirmOpen}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={() => {
					setIsConfirmOpen(false);
					handleSubmit();
				}}
				title="Ajukan Permintaan Pemakaian?"
				description="Permintaan akan dikirim ke Manajer Rendal untuk disetujui sebelum aset dapat dipakai."
				confirmLabel="Ya, Ajukan"
				pendingLabel="Mengirim..."
				isPending={isSubmitting}
			/>
		</>
	);
}
