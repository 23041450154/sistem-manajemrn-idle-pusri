"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
	getEquipments,
	getDisposals,
	getInspections,
	getDisposalMethods,
	createDisposalRequest,
} from "@/action/api";
import {
	Trash2,
	Search,
	RefreshCw,
	FileText,
	CheckCircle2,
	XCircle,
	Eye,
	Upload,
	X,
	ChevronRight,
} from "lucide-react";

interface Equipment {
	id: string;
	kodeAlat: string;
	namaAlat: string;
	plant: string;
	jenisAlat: string;
	tanggalRegistrasi: string;
	statusAset: string;
	storageLocation: string;
	funcLoc: string;
	vendor: string;
	year: string | number;
	originalValue: number;
	notes: string;
}

interface Inspection {
	id: number;
	equipment_id: number;
	notes: string;
	is_utilizable?: boolean;
}

interface DisposalMethod {
	id: number;
	name: string;
	description: string;
}

interface DisposalItem {
	id: string;
	equipment_id: string;
	disposal_number: string;
}

export default function VerifikasiDisposalPage() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [inspections, setInspections] = useState<Inspection[]>([]);
	const [disposals, setDisposals] = useState<DisposalItem[]>([]);
	const [methods, setMethods] = useState<DisposalMethod[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filter & Search
	const [search, setSearch] = useState("");

	// Modal State
	const [selectedAsset, setSelectedAsset] = useState<Equipment | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Form Fields State
	const [disposalNumber, setDisposalNumber] = useState("");
	const [verificationDate, setVerificationDate] = useState("");
	const [disposalMethodId, setDisposalMethodId] = useState("");
	const [justification, setJustification] = useState("");
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const loadData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [eqData, insData, dispData, methData] = await Promise.all([
				getEquipments(),
				getInspections(),
				getDisposals(),
				getDisposalMethods(),
			]);

			// Mapped Equipment Data
			const mappedEq = (eqData || []).map((item: any) => {
				const rawStatus =
					(typeof item.status === "string" ? item.status : item.status?.name) ||
					"";
				const objectTypeName =
					item.object_type?.name || item.objectType?.name || "Belum Ditentukan";
				return {
					id: item.id?.toString() || "-",
					kodeAlat: item.equipment_code || "-",
					namaAlat: item.name || "-",
					plant: item.plant?.name || "-",
					jenisAlat: objectTypeName,
					tanggalRegistrasi: item.created_at
						? new Date(item.created_at).toISOString().split("T")[0]
						: "-",
					statusAset: rawStatus.toUpperCase(),
					storageLocation: item.storage_location?.name || "-",
					funcLoc: item.func_loc || "-",
					vendor: item.vendor || "-",
					year: item.year || "-",
					originalValue: item.original_value || 0,
					notes: item.notes || "-",
				};
			});

			setEquipments(mappedEq);
			setInspections(insData || []);
			setDisposals(dispData || []);
			setMethods(methData || []);
		} catch (err: any) {
			console.error(err);
			setError("Gagal memuat data dari server.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const showToast = (type: "success" | "error", message: string) => {
		setNotification({ type, message });
		setTimeout(() => setNotification(null), 4000);
	};

	// Filter only assets that are DISPOSAL_RECOMMENDED and don't have a disposal request yet
	const filteredAssets = useMemo(() => {
		const submittedIds = new Set(disposals.map((d) => String(d.equipment_id)));
		return equipments.filter((eq) => {
			const isRecommended = eq.statusAset === "DISPOSAL_RECOMMENDED";
			const isNotSubmitted = !submittedIds.has(eq.id);
			const matchSearch =
				eq.kodeAlat.toLowerCase().includes(search.toLowerCase()) ||
				eq.namaAlat.toLowerCase().includes(search.toLowerCase());
			return isRecommended && isNotSubmitted && matchSearch;
		});
	}, [equipments, disposals, search]);

	const handleOpenVerification = (asset: Equipment) => {
		setSelectedAsset(asset);

		// Auto Generate Disposal Number e.g. DSP-2026-0001
		const currentYear = new Date().getFullYear();
		const count = disposals.length + 1;
		const autoNumber = `DSP-${currentYear}-${String(count).padStart(4, "0")}`;
		setDisposalNumber(autoNumber);

		// Auto set verification date to today
		const todayStr = new Date().toISOString().split("T")[0];
		setVerificationDate(todayStr);

		// Default disposal method to ID 2 (Scrap) if available, otherwise first option
		const defaultMethod =
			methods.find((m) => m.name.toLowerCase() === "scrap")?.id?.toString() ||
			methods[0]?.id?.toString() ||
			"";
		setDisposalMethodId(defaultMethod);

		setJustification("");
		setUploadedFile(null);
		setIsModalOpen(true);
	};

	// Find latest inspection details for selected asset
	const assetInspection = useMemo(() => {
		if (!selectedAsset) return null;
		return (
			inspections
				.filter((ins) => String(ins.equipment_id) === String(selectedAsset.id))
				.sort((a, b) => b.id - a.id)[0] || null
		);
	}, [selectedAsset, inspections]);

	const handleSubmitVerification = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedAsset) return;

		setIsSubmitting(true);
		try {
			const payload = {
				disposal_number: disposalNumber,
				equipment_id: Number(selectedAsset.id),
				disposal_method_id: Number(disposalMethodId),
				scrap_value: 0,
				disposal_date: verificationDate,
				justification:
					justification.trim() ||
					"Diverifikasi oleh Rendal Pemeliharaan untuk pengajuan disposal.",
			};

			const res = await createDisposalRequest(payload);
			if (res.success) {
				// Handle file upload if present
				if (uploadedFile) {
					const fd = new FormData();
					fd.append("equipment_id", selectedAsset.id);
					fd.append("file", uploadedFile);
					fd.append("category", "disposal_attachment");

					const tokenMatch = document.cookie.match(
						/(^|;)\s*token\s*=\s*([^;]+)/,
					);
					const token = tokenMatch ? tokenMatch[2] : "";
					const API_URL =
						process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

					await fetch(`${API_URL}/api/attachments/upload`, {
						method: "POST",
						headers: { Authorization: `Bearer ${token}` },
						body: fd,
					}).catch((err) =>
						console.error("Error uploading disposal doc:", err),
					);
				}

				showToast(
					"success",
					"Usulan disposal berhasil diverifikasi dan dikirim ke Manajer!",
				);
				setIsModalOpen(false);
				loadData();
			} else {
				showToast("error", res.message || "Gagal menyimpan verifikasi.");
			}
		} catch (err) {
			console.error(err);
			showToast("error", "Terjadi kesalahan sistem saat mengirim verifikasi.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Toast Notification */}
			{notification && (
				<div className="fixed top-6 right-6 z-[70] bg-gray-950 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-4 h-4 text-emerald-400" />
					) : (
						<XCircle className="w-4 h-4 text-red-400" />
					)}
					<span className="text-[14px] font-medium">
						{notification.message}
					</span>
				</div>
			)}

			{/* Page Header */}
			<div className="mb-6">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Rendal Pemeliharaan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">
						Verifikasi Disposal
					</span>
				</div>
				<h1 className="text-xl font-bold text-gray-900 tracking-tight">
					Verifikasi Usulan Disposal
				</h1>
				<p className="text-[13px] text-gray-500 mt-1">
					Menampilkan daftar aset yang direkomendasikan untuk disposal oleh
					Inspeksi Teknik dan menunggu verifikasi dari Rendal Pemeliharaan
					sebelum diajukan kepada Manajer.
				</p>
			</div>

			{/* Toolbar / Search */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Cari kode atau nama alat..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-1 focus:ring-[#0A356A] bg-white text-gray-800"
					/>
				</div>
				<button
					onClick={loadData}
					disabled={isLoading}
					className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-[14px] font-medium hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
				>
					<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
					Refresh
				</button>
			</div>

			{/* Main Table Container */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-50/75 border-b border-gray-200">
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider">
									No
								</th>
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider">
									Kode Alat
								</th>
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider">
									Nama Alat
								</th>
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider">
									Plant
								</th>
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider">
									Lokasi Penyimpanan
								</th>
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider">
									Kondisi Fisik
								</th>
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider">
									Status
								</th>
								<th className="px-5 py-3.5 text-[13px] font-bold text-gray-600 uppercase tracking-wider text-center">
									Aksi
								</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr>
									<td colSpan={8} className="text-center py-10">
										<div className="flex flex-col items-center justify-center gap-2 text-gray-500">
											<RefreshCw className="w-6 h-6 animate-spin text-[#0A356A]" />
											<span className="text-[14px]">Memuat data...</span>
										</div>
									</td>
								</tr>
							) : filteredAssets.length === 0 ? (
								<tr>
									<td
										colSpan={8}
										className="text-center py-12 text-gray-500 text-[14px]"
									>
										Tidak ada usulan disposal yang menunggu verifikasi.
									</td>
								</tr>
							) : (
								filteredAssets.map((asset, index) => (
									<tr
										key={asset.id}
										className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
										style={{ height: "46px" }}
									>
										<td className="px-5 py-2 text-[14px] text-gray-800 font-medium">
											{index + 1}
										</td>
										<td className="px-5 py-2 text-[14px] font-semibold text-[#0A356A]">
											{asset.kodeAlat}
										</td>
										<td className="px-5 py-2 text-[14px] text-gray-900 font-medium">
											{asset.namaAlat}
										</td>
										<td className="px-5 py-2 text-[14px] text-gray-800">
											{asset.plant}
										</td>
										<td className="px-5 py-2 text-[14px] text-gray-700">
											{asset.storageLocation}
										</td>
										<td className="px-5 py-2 text-[14px] text-gray-800">
											<span className="font-semibold">{asset.vendor}</span>
										</td>
										<td className="px-5 py-2 text-[14px]">
											<span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200 uppercase tracking-wide">
												Disposal Recommended
											</span>
										</td>
										<td className="px-5 py-2 text-center">
											<button
												onClick={() => handleOpenVerification(asset)}
												className="px-4 py-1.5 bg-[#0A356A] hover:bg-[#062854] text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm"
											>
												Verifikasi
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Drawer / Modal Verifikasi */}
			{isModalOpen && selectedAsset && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
						onClick={() => setIsModalOpen(false)}
					/>

					<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
						{/* Header */}
						<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
							<div className="flex items-center gap-2.5">
								<Trash2 className="w-5 h-5 text-[#0A356A]" />
								<div>
									<h2 className="text-base font-bold text-gray-900">
										Verifikasi Usulan Disposal
									</h2>
									<p className="text-xs text-gray-500 mt-0.5">
										{selectedAsset.kodeAlat}
									</p>
								</div>
							</div>
							<button
								onClick={() => setIsModalOpen(false)}
								className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Scrollable Form Body */}
						<form
							onSubmit={handleSubmitVerification}
							className="flex-1 overflow-y-auto flex flex-col"
						>
							<div className="p-6 flex flex-col gap-6">
								{/* Read Only Asset Info */}
								<div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
									<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
										<FileText className="w-4 h-4" /> Informasi Aset (Read-Only)
									</h3>
									<div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kode Alat
											</p>
											<p className="text-sm font-semibold text-gray-800">
												{selectedAsset.kodeAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Nama Alat
											</p>
											<p className="text-sm font-semibold text-gray-800">
												{selectedAsset.namaAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Plant
											</p>
											<p className="text-sm font-medium text-gray-800">
												{selectedAsset.plant}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Lokasi Penyimpanan
											</p>
											<p className="text-sm font-medium text-gray-800">
												{selectedAsset.storageLocation}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Kategori
											</p>
											<p className="text-sm font-medium text-gray-800">
												{selectedAsset.jenisAlat}
											</p>
										</div>
										<div>
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Hasil Inspeksi
											</p>
											<p className="text-sm font-bold text-red-600">
												Tidak Layak (Rekomendasi Disposal)
											</p>
										</div>
										<div className="col-span-2">
											<p className="text-[10px] font-bold text-gray-400 uppercase">
												Alasan Disposal dari Inspeksi
											</p>
											<p className="text-xs text-gray-600 mt-1 leading-relaxed bg-white border border-gray-200 p-2.5 rounded-lg">
												{assetInspection?.notes ||
													"Rekomendasi disposal dari hasil penilaian kelayakan Inspeksi Teknik."}
											</p>
										</div>
									</div>
								</div>

								{/* Form Verifikasi */}
								<div className="flex flex-col gap-4">
									<h3 className="text-xs font-bold text-[#0A356A] uppercase tracking-wider mb-1">
										Form Verifikasi Disposal
									</h3>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">
												Nomor Usulan Disposal
											</label>
											<input
												type="text"
												value={disposalNumber}
												readOnly
												className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
											/>
										</div>

										<div>
											<label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">
												Tanggal Verifikasi
											</label>
											<input
												type="date"
												value={verificationDate}
												readOnly
												className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
											/>
										</div>
									</div>

									<div>
										<label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">
											Metode Disposal *
										</label>
										<select
											value={disposalMethodId}
											onChange={(e) => setDisposalMethodId(e.target.value)}
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0A356A]"
										>
											<option value="">Pilih Metode...</option>
											{methods.map((m) => (
												<option key={m.id} value={m.id}>
													{m.name} - {m.description}
												</option>
											))}
										</select>
									</div>

									<div>
										<label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">
											Catatan Verifikasi (Justifikasi)
										</label>
										<textarea
											rows={3}
											placeholder="Masukkan catatan pendukung atau justifikasi tambahan..."
											value={justification}
											onChange={(e) => setJustification(e.target.value)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0A356A] bg-white text-gray-800"
										/>
									</div>

									<div>
										<label className="block text-[12px] font-bold text-gray-700 uppercase mb-1">
											Dokumen Pendukung
										</label>
										<div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
											<input
												type="file"
												accept=".pdf,.png,.jpg,.jpeg"
												onChange={(e) =>
													setUploadedFile(e.target.files?.[0] || null)
												}
												className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
											/>
											<Upload className="w-8 h-8 text-gray-400 mb-2" />
											<span className="text-xs font-semibold text-gray-600">
												{uploadedFile
													? uploadedFile.name
													: "Klik atau seret file PDF / Gambar pendukung"}
											</span>
											<span className="text-[10px] text-gray-400 mt-1">
												Maks. 5MB (Optional)
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Footer Actions */}
							<div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
								<button
									type="button"
									onClick={() => setIsModalOpen(false)}
									disabled={isSubmitting}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 bg-white transition-colors"
								>
									Batal
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-5 py-2 bg-[#0A356A] hover:bg-[#062854] text-white rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-2"
								>
									{isSubmitting ? (
										<RefreshCw className="w-4 h-4 animate-spin" />
									) : null}
									{isSubmitting ? "Mengirim..." : "Kirim ke Manajer"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
