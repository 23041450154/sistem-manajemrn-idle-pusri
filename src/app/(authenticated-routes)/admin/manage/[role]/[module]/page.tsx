"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Database, Edit3, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { getEquipments, updateEquipment } from "@/action/api";
import { getMasterItems, type MasterItem } from "@/action/master";

const MODULE_LABELS: Record<string, string> = {
	validasi: "Validasi Kelayakan",
	revalidasi: "Validasi Perbaikan",
	berkala: "Inspeksi Berkala",
	perbaikan: "Perbaikan Alat",
	persetujuan: "Persetujuan Perbaikan",
};

const ROLE_LABELS: Record<string, string> = {
	inspeksi: "Inspeksi",
	pemeliharaan: "Pemeliharaan",
	rendal: "Rendal",
};

const STATUS_RULES: Record<string, string[]> = {
	validasi: ["VALIDATED", "REPAIR", "SCRAP_RECOMMENDED", "SCRAP RECOMMENDED", "SCRAP"],
	revalidasi: ["READY_TO_USE", "READY TO USE", "REPAIR", "SCRAP", "SCRAP_RECOMMENDED", "SCRAP RECOMMENDED"],
	berkala: ["VALIDATED", "READY_TO_USE", "READY TO USE", "REPAIR", "SCRAP_RECOMMENDED", "SCRAP RECOMMENDED", "SCRAP"],
	perbaikan: ["REPAIR", "REPAIR_COMPLETED", "REPAIR COMPLETED"],
	persetujuan: ["READY_TO_USE", "READY TO USE", "SCRAP", "SCRAP_RECOMMENDED", "SCRAP RECOMMENDED"],
};

// Dataset yang tampil mengikuti antrean/riwayat pada halaman role terkait.
const DATA_STATUS_RULES: Record<string, string[]> = {
	validasi: ["REGISTERED", "REVISION_REQUIRED", "VALIDATED", "REPAIR", "SCRAP_RECOMMENDED", "SCRAP"],
	revalidasi: ["REPAIR_COMPLETED", "REVALIDATION", "READY_TO_USE", "SCRAP"],
	berkala: ["IDLE", "READY_TO_USE", "READY_TO_REUSE"],
	perbaikan: ["REPAIR", "REPAIR_COMPLETED", "REVALIDATION", "READY_TO_USE", "SCRAP"],
	persetujuan: ["REVALIDATION", "READY_TO_USE"],
};
const STATUS_ID_NAMES: Record<number, string> = {
	1: "REGISTERED", 2: "VALIDATED", 3: "REPAIR", 4: "REPAIR_COMPLETED",
	5: "REVALIDATION", 6: "READY_TO_USE", 8: "SCRAP",
};

const normalizeStatus = (value: unknown) => String(value || "").toUpperCase().replace(/-/g, "_");

export default function AdminRoleDataPage() {
	const params = useParams<{ role: string; module: string }>();
	const role = String(params.role || "");
	const module = String(params.module || "");
	const [items, setItems] = useState<any[]>([]);
	const [statuses, setStatuses] = useState<MasterItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [editing, setEditing] = useState<any | null>(null);
	const [name, setName] = useState("");
	const [statusId, setStatusId] = useState<number | "">("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	const load = async () => {
		setLoading(true);
		setCurrentPage(1);
		const [equipment, statusList] = await Promise.all([getEquipments(), getMasterItems("status")]);
		const allowedDataStatuses = DATA_STATUS_RULES[module];
		const roleItems = Array.isArray(equipment) ? equipment.filter((item: any) => {
				if (!allowedDataStatuses?.length) return true;
				const statusName = normalizeStatus(item.status?.name || item.status || item.status_name || STATUS_ID_NAMES[Number(item.status_id)]);
				return allowedDataStatuses.some((allowed) => normalizeStatus(allowed) === statusName);
			}) : [];
		setItems(roleItems);
		setStatuses(statusList);
		setLoading(false);
	};

	useEffect(() => { void load(); }, []);
	useEffect(() => { setCurrentPage(1); }, [query, role, module]);

	const filtered = useMemo(() => {
		const value = query.toLowerCase().trim();
		const result = !value ? [...items] : items.filter((item) => {
			const itemName = typeof item.name === "string" ? item.name : item.name?.name;
			return [item.equipment_code, itemName, item.plant?.name || item.plant, item.status?.name || item.status]
				.some((field) => String(field || "").toLowerCase().includes(value));
		});
		return result.sort((a, b) => {
			const dateA = new Date(a.created_at || a.updated_at || 0).getTime();
			const dateB = new Date(b.created_at || b.updated_at || 0).getTime();
			if (dateA !== dateB) return dateB - dateA;
			return Number(b.id || 0) - Number(a.id || 0);
		});
	}, [items, query]);
	const itemsPerPage = 10;
	const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
	const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

	const openEdit = (item: any) => {
		setEditing(item);
		setName(typeof item.name === "string" ? item.name : item.name?.name || "");
		setStatusId(item.status_id ?? item.status?.id ?? "");
	};

	const save = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!editing || !name.trim() || saving) return;
		setSaving(true);
		const result = await updateEquipment(String(editing.id), { name: name.trim(), ...(statusId !== "" ? { status_id: Number(statusId) } : {}) });
		setSaving(false);
		setMessage(result.success
			? { type: "success", text: "Perubahan berhasil disimpan." }
			: { type: "error", text: result.message || "Gagal menyimpan perubahan." });
		if (result.success) { setEditing(null); await load(); }
		setTimeout(() => setMessage(null), 3500);
	};

	const title = MODULE_LABELS[module] || "Pengelolaan Data";
	const roleTitle = ROLE_LABELS[role] || "Role";
	const allowedStatuses = STATUS_RULES[module] || [];
	const editableStatuses = statuses.filter((status) => {
		const normalized = normalizeStatus(status.name);
		return allowedStatuses.some((allowed) => normalizeStatus(allowed) === normalized);
	});

	return (
		<div className="max-w-7xl mx-auto pt-6 pb-12 px-4 sm:px-6">
			<div className="mb-5 flex items-center justify-between gap-4">
				<div>
					<div className="text-xs text-slate-500 mb-1">Admin / Kelola Status / {roleTitle}</div>
					<h1 className="text-xl font-bold text-slate-900">{title}</h1>
					<p className="text-xs text-slate-500 mt-1">Kelola nama, status, dan informasi aset pada alur {roleTitle.toLowerCase()}.</p>
				</div>
				<button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Muat Ulang</button>
			</div>

			{message && <div className={`mb-4 px-4 py-3 rounded-lg text-white text-xs font-medium flex items-center gap-2 ${message.type === "success" ? "bg-slate-900" : "bg-red-700"}`}>{message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <XCircle className="w-4 h-4 text-red-100" />}{message.text}</div>}

			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="p-3 border-b border-slate-200 flex items-center justify-between gap-3">
					<div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari kode, nama, plant, atau status..." className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#0A356A]" /></div>
					<span className="text-xs font-semibold text-slate-500">{filtered.length} data</span>
				</div>
				{loading ? <div className="py-20 text-center text-xs text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0A356A]" />Memuat data...</div> : filtered.length === 0 ? <div className="py-20 text-center text-xs text-slate-500"><Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />Belum ada data yang sesuai.</div> : (<>
					<div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 text-center w-14">No</th><th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">Kode</th><th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">Nama Peralatan</th><th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">Plant</th><th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">Status</th><th className="px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{paginated.map((item, index) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-xs text-center text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td><td className="px-4 py-3 text-xs font-mono text-[#0A356A]">{item.equipment_code || "-"}</td><td className="px-4 py-3 text-xs font-semibold text-slate-800">{typeof item.name === "string" ? item.name : item.name?.name || "-"}</td><td className="px-4 py-3 text-xs text-slate-500">{item.plant?.name || item.plant || "-"}</td><td className="px-4 py-3 text-xs text-slate-600">{item.status?.name || item.status || "-"}</td><td className="px-4 py-3 text-right"><button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#0A356A] hover:bg-blue-50"><Edit3 className="w-3.5 h-3.5" /> Ubah</button></td></tr>)}</tbody></table></div>
					<div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Menampilkan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data</span><div className="flex items-center gap-2"><button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Sebelumnya</button><span className="text-xs font-bold text-[#0A356A]">{currentPage} / {totalPages}</span><button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Berikutnya</button></div></div>
				</>)}
			</div>

			{editing && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !saving && setEditing(null)} /><form onSubmit={save} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6"><h2 className="text-base font-bold text-slate-900 mb-5">Ubah Data Aset</h2><label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Peralatan</label><input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 mb-4 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#0A356A]" /><label className="block text-xs font-bold text-slate-700 mb-1.5">Status yang diizinkan pada {title}</label><select value={statusId} onChange={(e) => setStatusId(e.target.value ? Number(e.target.value) : "")} className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#0A356A]"><option value="">Pertahankan status saat ini</option>{editableStatuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select><p className="text-[11px] text-slate-400 mt-2">Status dari alur role lain tidak dapat dipilih di halaman ini.</p><div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-lg">Batal</button><button disabled={saving} className="px-4 py-2 text-xs font-bold bg-[#0A356A] text-white rounded-lg disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan"}</button></div></form></div>}
		</div>
	);
}
