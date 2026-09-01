"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
	Plus,
	Trash2,
	Pencil,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	Loader2,
	Database,
	Lock,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
	getMasterItems,
	createMasterItem,
	updateMasterItem,
	deleteMasterItem,
	type MasterItem,
} from "@/action/master";
import type { MasterEntity } from "@/lib/master-entities";

const ITEMS_PER_PAGE = 10;

export function MasterDataTable({ entity }: { entity: MasterEntity }) {
	const readOnly = entity.adminPath === null;

	const [items, setItems] = useState<MasterItem[]>([]);
	const [plants, setPlants] = useState<MasterItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [lastSlug, setLastSlug] = useState(entity.slug);

	// Reset page when entity changes (render-phase update, not effect).
	if (lastSlug !== entity.slug) {
		setLastSlug(entity.slug);
		setCurrentPage(1);
	}

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<MasterItem | null>(null);
	const [deleting, setDeleting] = useState<MasterItem | null>(null);

	const [itemName, setItemName] = useState("");
	const [itemDesc, setItemDesc] = useState("");
	const [itemPlantId, setItemPlantId] = useState<number | "">("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	const notify = (type: "success" | "error", message: string) => {
		setNotification({ type, message });
		setTimeout(() => setNotification(null), 3000);
	};

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		const data = await getMasterItems(entity.slug);
		setItems(data);
		setIsLoading(false);
	}, [entity.slug]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- fetching external API data on mount is the intended effect use
		void fetchData();
		if (entity.needsPlant) getMasterItems("plant").then(setPlants);
	}, [entity.needsPlant, fetchData]);

	const openCreate = () => {
		setEditing(null);
		setItemName("");
		setItemDesc("");
		setItemPlantId("");
		setFormOpen(true);
	};

	const openEdit = (item: MasterItem) => {
		setEditing(item);
		setItemName(item.name ?? "");
		setItemDesc(item.description ?? "");
		setItemPlantId(item.plant_id ?? "");
		setFormOpen(true);
	};

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!itemName.trim()) return;

		setIsSubmitting(true);
		const payload = {
			name: itemName,
			description: itemDesc,
			plantId: itemPlantId === "" ? undefined : Number(itemPlantId),
		};
		const res = editing
			? await updateMasterItem(entity.slug, editing.id, payload)
			: await createMasterItem(entity.slug, payload);
		setIsSubmitting(false);

		if (res.success) {
			setFormOpen(false);
			setEditing(null);
			notify(
				"success",
				editing ? "Data master diperbarui." : "Data master ditambahkan.",
			);
			fetchData();
		} else {
			notify("error", res.message || "Gagal menyimpan data.");
		}
	};

	const handleDelete = async () => {
		if (!deleting) return;
		setIsSubmitting(true);
		const res = await deleteMasterItem(entity.slug, deleting.id);
		setIsSubmitting(false);

		if (res.success) {
			setDeleting(null);
			notify("success", "Data master dihapus.");
			fetchData();
		} else {
			notify(
				"error",
				res.message || "Gagal menghapus data. Pastikan tidak ada data terkait.",
			);
		}
	};

	const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
	const paginated = items.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	return (
		<div className="max-w-7xl mx-auto pt-6 pb-12 px-4 sm:px-6">
			{notification && (
				<div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-gray-700">
					{notification.type === "success" ? (
						<CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
					) : (
						<XCircle className="w-5 h-5 text-red-400 shrink-0" />
					)}
					<span className="text-[13px] font-medium leading-snug">
						{notification.message}
					</span>
				</div>
			)}

			<div className="bg-[#0A356A] rounded-2xl px-6 py-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
						<Database className="w-5 h-5" />
					</div>
					<div>
						<h1 className="text-xl font-bold text-white tracking-tight">
							{entity.label}
						</h1>
						<p className="text-xs text-blue-200/90 mt-0.5 font-medium max-w-xl">
							Data referensi untuk formulir inspeksi &amp; inventaris.
						</p>
					</div>
				</div>

				{readOnly ? (
					<span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-100 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0">
						<Lock className="w-4 h-4" />
						Read-only
					</span>
				) : (
					<button
						onClick={openCreate}
						className="bg-white hover:bg-blue-50 active:scale-[0.98] text-[#0A356A] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
					>
						<Plus className="w-4 h-4" />
						<span>Tambah {entity.label}</span>
					</button>
				)}
			</div>

			<div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-12">
						<Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
						<p className="text-xs font-semibold text-slate-500">
							Memuat data {entity.label}...
						</p>
					</div>
				) : items.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center px-4">
						<div className="w-12 h-12 bg-slate-100 text-[#0A356A] rounded-2xl flex items-center justify-center mb-3">
							<Database className="w-6 h-6" />
						</div>
						<h3 className="text-sm font-bold text-slate-900 mb-1">Belum ada data</h3>
						<p className="text-xs text-slate-500 max-w-md">
							{readOnly
								? `Data ${entity.label} dikelola dari backend.`
								: `Tambahkan entri ${entity.label} baru.`}
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead className="bg-slate-50 border-b border-slate-200">
								<tr>
									<th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">
										ID
									</th>
									<th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
										Nama Entri
									</th>
									{entity.needsPlant && (
										<th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
											Plant
										</th>
									)}
									<th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
										Deskripsi
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-slate-100">
								{paginated.map((item) => (
									<tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
										<td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-medium text-slate-400">
											#{item.id}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-900">
											{item.name}
										</td>
										{entity.needsPlant && (
											<td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
												{item.plant?.name || "-"}
											</td>
										)}
										<td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-md">
											{item.description || <span className="text-slate-300">-</span>}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{items.length > 0 && (
					<div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
						<span className="text-xs font-medium text-slate-500">
							Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
							{Math.min(currentPage * ITEMS_PER_PAGE, items.length)} dari{" "}
							{items.length} data
						</span>
						{totalPages > 1 && (
							<div className="flex items-center gap-1.5">
								<button
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
								>
									Prev
								</button>
								<div className="flex items-center gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
										<button
											key={page}
											onClick={() => setCurrentPage(page)}
											className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
												currentPage === page
													? "bg-[#0A356A] text-white"
													: "text-slate-600 hover:bg-slate-100"
											}`}
										>
											{page}
										</button>
									))}
								</div>
								<button
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
								>
									Next
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{formOpen && !readOnly && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
						onClick={() => !isSubmitting && setFormOpen(false)}
					/>

					<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
						<div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
							<h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
								{editing ? (
									<Pencil className="w-5 h-5 text-[#0A356A]" />
								) : (
									<Plus className="w-5 h-5 text-[#0A356A]" />
								)}
								{editing ? `Ubah ${entity.label}` : `Tambah ${entity.label}`}
							</h3>
						</div>

						<form onSubmit={handleSubmit}>
							<div className="mb-4">
								<label
									htmlFor="master-name"
									className="block text-xs font-bold text-slate-700 mb-1.5"
								>
									Nama Entri <span className="text-red-500">*</span>
								</label>
								<input
									id="master-name"
									required
									type="text"
									value={itemName}
									onChange={(e) => setItemName(e.target.value)}
									placeholder={entity.placeholder}
									className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all font-medium"
								/>
							</div>

							{entity.needsPlant && (
								<div className="mb-4">
									<label
										htmlFor="master-plant"
										className="block text-xs font-bold text-slate-700 mb-1.5"
									>
										Plant <span className="text-red-500">*</span>
									</label>
									<select
										id="master-plant"
										required
										value={itemPlantId}
										onChange={(e) =>
											setItemPlantId(e.target.value === "" ? "" : Number(e.target.value))
										}
										className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none font-semibold text-slate-700 cursor-pointer"
									>
										<option value="">Pilih plant...</option>
										{plants.map((plant) => (
											<option key={plant.id} value={plant.id}>
												{plant.name}
											</option>
										))}
									</select>
								</div>
							)}

							<div className="mb-5">
								<label
									htmlFor="master-desc"
									className="block text-xs font-bold text-slate-700 mb-1.5"
								>
									Keterangan / Deskripsi
								</label>
								<textarea
									id="master-desc"
									rows={3}
									value={itemDesc}
									onChange={(e) => setItemDesc(e.target.value)}
									placeholder="Masukkan deskripsi rinci..."
									className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all resize-none font-medium"
								/>
							</div>

							<div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-100">
								<button
									type="button"
									onClick={() => setFormOpen(false)}
									disabled={isSubmitting}
									className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-70"
								>
									Batal
								</button>
								<button
									type="button"
									onClick={() => setIsSaveConfirmOpen(true)}
									disabled={isSubmitting || !itemName.trim()}
									className="px-5 py-2.5 bg-[#0A356A] text-white rounded-xl text-xs font-bold hover:bg-[#0556B3] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
								>
									{isSubmitting ? (
										<Loader2 className="w-4 h-4 animate-spin" />
									) : (
										<CheckCircle2 className="w-4 h-4" />
									)}
									{isSubmitting ? "Menyimpan..." : "Simpan Data"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{deleting && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
						onClick={() => !isSubmitting && setDeleting(null)}
					/>

					<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-slate-100">
						<div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
							<AlertTriangle className="w-6 h-6" />
						</div>

						<h3 className="text-base font-bold text-slate-900 mb-2">
							Hapus data master?
						</h3>

						<p className="text-xs text-slate-600 mb-5 leading-relaxed font-medium">
							Anda akan menghapus{" "}
							<span className="font-bold text-slate-900">
								&quot;{deleting.name}&quot;
							</span>
							. Tindakan ini tidak dapat dibatalkan dan mempengaruhi pilihan dropdown
							pada modul terkait.
						</p>

						<div className="flex items-center gap-3 w-full justify-center mt-2">
							<button
								onClick={() => setDeleting(null)}
								disabled={isSubmitting}
								className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors w-full disabled:opacity-70"
							>
								Batal
							</button>
							<button
								onClick={handleDelete}
								disabled={isSubmitting}
								className="px-5 py-2.5 bg-[#dc2626] text-white rounded-xl text-xs font-bold hover:bg-[#b91c1c] transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
							>
								{isSubmitting ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Trash2 className="w-4 h-4" />
								)}
								{isSubmitting ? "Menghapus..." : "Ya, Hapus Data"}
							</button>
						</div>
					</div>
				</div>
			)}
			<ConfirmDialog
				open={isSaveConfirmOpen}
				onClose={() => setIsSaveConfirmOpen(false)}
				onConfirm={() => {
					setIsSaveConfirmOpen(false);
					handleSubmit();
				}}
				title={editing ? "Simpan Perubahan Data Master?" : "Tambah Data Master?"}
				description={`${itemName.trim() || "Item"} akan ${editing ? "diperbarui" : "ditambahkan"} pada master ${entity.label}.`}
				confirmLabel={editing ? "Ya, Simpan" : "Ya, Tambah"}
				pendingLabel="Menyimpan..."
				isPending={isSubmitting}
			/>
		</div>
	);
}
