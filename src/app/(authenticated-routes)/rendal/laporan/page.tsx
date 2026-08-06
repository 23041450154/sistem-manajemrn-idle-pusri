"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
	Search,
	RefreshCw,
	Download,
	ChevronRight,
	FileText,
	Filter,
	X,
	CheckCircle2,
	Edit3,
	Trash2,
	Plus,
	Upload,
	AlertCircle,
	Eye,
	Clock,
} from "lucide-react";
import {
	getEquipments,
	getApprovals,
	getInspections,
	getDisposals,
} from "@/action/api";

interface AuditLogEntry {
	id: string;
	timestamp: string;
	actor: string;
	actorRole: string;
	action: string;
	actionType:
		| "CREATE"
		| "UPDATE"
		| "DELETE"
		| "APPROVE"
		| "REJECT"
		| "INSPECT"
		| "UPLOAD"
		| "REVIEW";
	module: string;
	entityCode: string;
	entityName: string;
	description: string;
	oldValue?: string;
	newValue?: string;
}

function buildAuditLogs(
	equipments: any[],
	approvals: any[],
	inspections: any[],
	disposals: any[],
): AuditLogEntry[] {
	const logs: AuditLogEntry[] = [];

	// Equipment registrations
	equipments.forEach((eq: any) => {
		logs.push({
			id: `eq-create-${eq.id}`,
			timestamp: eq.created_at || new Date().toISOString(),
			actor: eq.created_by_npp || eq.updated_by_npp || "System",
			actorRole: "Rendal Pemeliharaan",
			action: "Registrasi Aset",
			actionType: "CREATE",
			module: "Equipment",
			entityCode: eq.equipment_code || "-",
			entityName: eq.name || "-",
			description: `Aset ${eq.name} didaftarkan dengan kode ${eq.equipment_code}`,
			newValue: eq.status?.name || "REGISTERED",
		});

		if (eq.updated_at && eq.updated_at !== eq.created_at) {
			logs.push({
				id: `eq-update-${eq.id}`,
				timestamp: eq.updated_at,
				actor: eq.updated_by_npp || eq.created_by_npp || "System",
				actorRole: "Rendal Pemeliharaan",
				action: "Update Data Aset",
				actionType: "UPDATE",
				module: "Equipment",
				entityCode: eq.equipment_code || "-",
				entityName: eq.name || "-",
				description: `Data aset ${eq.name} diperbarui`,
				oldValue: "-",
				newValue: eq.status?.name || "-",
			});
		}
	});

	// Inspections
	inspections.forEach((ins: any) => {
		logs.push({
			id: `ins-${ins.id}`,
			timestamp:
				ins.created_at || ins.inspection_date || new Date().toISOString(),
			actor: ins.inspector_npp || ins.inspector?.name || "Inspektor",
			actorRole: "Inspeksi Teknik",
			action: "Inspeksi Teknik",
			actionType: "INSPECT",
			module: "Inspection",
			entityCode: ins.equipment?.equipment_code || `EQ-${ins.equipment_id}`,
			entityName: ins.equipment?.name || "-",
			description: `Hasil inspeksi: ${ins.mechanical_condition || "N/A"} / ${ins.electrical_condition || "N/A"}`,
			newValue: ins.require_action?.name || ins.notes || "VALIDATED",
		});
	});

	// Approvals
	approvals.forEach((app: any) => {
		let actionType: AuditLogEntry["actionType"] = "REVIEW";
		let actionLabel = "Pengajuan Dibuat";
		if (app.approval_status === "APPROVED") {
			actionType = "APPROVE";
			actionLabel = "Persetujuan Disetujui";
		} else if (app.approval_status === "REVISION_REQUIRED") {
			actionType = "REJECT";
			actionLabel = "Permintaan Revisi";
		} else if (app.approval_status === "IN_REVIEW") {
			actionType = "REVIEW";
			actionLabel = "Sedang Direview";
		}

		logs.push({
			id: `app-${app.id}`,
			timestamp: app.updated_at || app.request_date || new Date().toISOString(),
			actor: app.reviewer_npp || app.approved_by || "Manajer Rendal",
			actorRole: "Manajer Rendal",
			action: actionLabel,
			actionType,
			module: "Approval",
			entityCode: app.equipment_code || `EQ-${app.equipment_id}`,
			entityName: app.equipment_name || "-",
			description: `Pengajuan ${app.request_number}: ${actionLabel}`,
			oldValue: "PENDING",
			newValue: app.approval_status || "PENDING",
		});
	});

	// Disposals
	disposals.forEach((disp: any) => {
		logs.push({
			id: `disp-${disp.id}`,
			timestamp: disp.created_at || new Date().toISOString(),
			actor: "Rendal Pemeliharaan",
			actorRole: "Rendal Pemeliharaan",
			action:
				disp.status === "DISPOSED"
					? "Disposal Disetujui"
					: "Pengajuan Disposal",
			actionType: disp.status === "DISPOSED" ? "APPROVE" : "CREATE",
			module: "Disposal",
			entityCode: disp.equipment_code || "-",
			entityName: disp.equipment_name || "-",
			description: `${disp.disposal_number}: ${disp.justification?.slice(0, 80) || "Pengajuan disposal aset"}`,
			oldValue: "PENDING",
			newValue: disp.status || "PENDING",
		});
	});

	// Sort by timestamp descending
	logs.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);

	return logs;
}

const actionTypeConfig: Record<string, { badge: string }> = {
	CREATE: { badge: "bg-[#E0F2FE] text-[#0284C7]" },
	UPDATE: { badge: "bg-[#FEF9C3] text-[#CA8A04]" },
	DELETE: { badge: "bg-[#FEE2E2] text-[#DC2626]" },
	APPROVE: { badge: "bg-[#DCFCE7] text-[#16A34A]" },
	REJECT: { badge: "bg-[#F3E8FF] text-[#9333EA]" },
	INSPECT: { badge: "bg-[#CFFAFE] text-[#0891B2]" },
	UPLOAD: { badge: "bg-[#E0E7FF] text-[#4F46E5]" },
	REVIEW: { badge: "bg-gray-100 text-gray-600" },
};

export default function AuditTrailPage() {
	const [logs, setLogs] = useState<AuditLogEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [moduleFilter, setModuleFilter] = useState("Semua");
	const [actionFilter, setActionFilter] = useState("Semua");
	const [showFilters, setShowFilters] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	useEffect(() => {
		async function fetchAuditData() {
			setIsLoading(true);
			try {
				const [eq, apps, ins, disps] = await Promise.all([
					getEquipments(),
					getApprovals(),
					getInspections(),
					getDisposals(),
				]);
				const auditLogs = buildAuditLogs(
					eq || [],
					apps || [],
					ins || [],
					disps || [],
				);
				setLogs(auditLogs);
			} catch (err) {
				console.error("Error fetching audit trail:", err);
			} finally {
				setIsLoading(false);
			}
		}
		fetchAuditData();
	}, []);

	const filteredLogs = useMemo(() => {
		return logs.filter((log) => {
			const matchSearch =
				!search ||
				log.entityCode.toLowerCase().includes(search.toLowerCase()) ||
				log.entityName.toLowerCase().includes(search.toLowerCase()) ||
				log.actor.toLowerCase().includes(search.toLowerCase()) ||
				log.description.toLowerCase().includes(search.toLowerCase());
			const matchModule =
				moduleFilter === "Semua" || log.module === moduleFilter;
			const matchAction =
				actionFilter === "Semua" || log.actionType === actionFilter;
			return matchSearch && matchModule && matchAction;
		});
	}, [logs, search, moduleFilter, actionFilter]);

	const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
	const paginatedLogs = filteredLogs.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [search, moduleFilter, actionFilter]);

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "-";
		try {
			return new Date(dateStr).toLocaleString("id-ID", {
				day: "2-digit",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return dateStr;
		}
	};

	const handleExport = () => {
		const headers = [
			"Timestamp",
			"Aktivitas",
			"Tipe",
			"Modul",
			"Kode Entitas",
			"Nama Entitas",
			"Aktor",
			"Role",
			"Deskripsi",
			"Nilai Lama",
			"Nilai Baru",
		];
		const rows = filteredLogs.map((log) => [
			formatDate(log.timestamp),
			log.action,
			log.actionType,
			log.module,
			log.entityCode,
			log.entityName,
			log.actor,
			log.actorRole,
			log.description,
			log.oldValue || "-",
			log.newValue || "-",
		]);
		const csv = [headers, ...rows]
			.map((row) =>
				row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
			)
			.join("\n");
		const blob = new Blob(["\uFEFF" + csv], {
			type: "text/csv;charset=utf-8;",
		});
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`,
		);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Summary stats
	const stats = useMemo(() => {
		return {
			total: logs.length,
			create: logs.filter((l) => l.actionType === "CREATE").length,
			update: logs.filter((l) => l.actionType === "UPDATE").length,
			approve: logs.filter((l) => l.actionType === "APPROVE").length,
			inspect: logs.filter((l) => l.actionType === "INSPECT").length,
		};
	}, [logs]);

	return (
		<div className="max-w-7xl mx-auto pt-6 pb-8 px-6 font-sans">
			{/* Header */}
			<div className="mb-6">
				<div className="flex items-center gap-2 text-[12px] text-gray-500 font-medium mb-2">
					<span>Rendal Pemeliharaan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Log Audit Trail</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Laporan Log Audit Trail
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Pelacakan seluruh aktivitas perubahan data aset secara transparan
							dan terverifikasi.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => window.location.reload()}
							disabled={isLoading}
							className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm disabled:opacity-50"
						>
							<RefreshCw
								className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
							/>
							Muat Ulang
						</button>
						<button
							onClick={handleExport}
							className="flex items-center gap-2 px-4 py-2 bg-[#0A356A] hover:bg-[#0556B3] text-white rounded text-[13px] font-semibold transition-colors shadow-sm"
						>
							<Download className="w-4 h-4" />
							Export CSV
						</button>
					</div>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
				<div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
							<FileText className="w-4 h-4 text-blue-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Total Log
						</span>
					</div>
					<p className="text-2xl font-bold text-gray-800">{stats.total}</p>
				</div>
				<div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center">
							<Plus className="w-4 h-4 text-emerald-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Pembuatan
						</span>
					</div>
					<p className="text-2xl font-bold text-gray-800">{stats.create}</p>
				</div>
				<div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center">
							<Edit3 className="w-4 h-4 text-amber-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Pembaruan
						</span>
					</div>
					<p className="text-2xl font-bold text-gray-800">{stats.update}</p>
				</div>
				<div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-8 h-8 rounded bg-cyan-50 flex items-center justify-center">
							<Eye className="w-4 h-4 text-cyan-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Inspeksi
						</span>
					</div>
					<p className="text-2xl font-bold text-gray-800">{stats.inspect}</p>
				</div>
			</div>

			{/* Kontrol Tabel (Filter & Pencarian) */}
			<div className="bg-white p-4 border border-gray-200 rounded-t shadow-sm flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
					<div className="relative w-full sm:w-80">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							placeholder="Cari kode, nama, aktor, atau deskripsi..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") setSearch(searchInput);
							}}
							className="w-full pl-9 pr-4 py-2 text-[13px] bg-white border border-gray-300 rounded focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] transition-all outline-none placeholder:text-gray-400"
						/>
					</div>
					<div className="flex items-center gap-3 w-full sm:w-auto">
						<button
							onClick={() => setShowFilters(!showFilters)}
							className={`relative flex items-center gap-2 px-4 py-1.5 rounded border text-[13px] font-semibold transition-colors ${showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
						>
							<Filter className="w-4 h-4" />
							Filter
							{(moduleFilter !== "Semua" || actionFilter !== "Semua") && (
								<span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1 -right-1 border border-white"></span>
							)}
						</button>
						{(moduleFilter !== "Semua" ||
							actionFilter !== "Semua" ||
							search ||
							searchInput) && (
							<button
								onClick={() => {
									setModuleFilter("Semua");
									setActionFilter("Semua");
									setSearch("");
									setSearchInput("");
								}}
								className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors whitespace-nowrap"
							>
								<X className="w-4 h-4" />
								Reset
							</button>
						)}
					</div>
				</div>

				{showFilters && (
					<div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
						<div className="flex items-center gap-2">
							<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
								Modul:
							</span>
							<select
								value={moduleFilter}
								onChange={(e) => setModuleFilter(e.target.value)}
								className="bg-white border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-700 outline-none focus:border-[#0A356A] cursor-pointer font-medium"
							>
								<option value="Semua">Semua Modul</option>
								<option value="Equipment">Equipment</option>
								<option value="Inspection">Inspection</option>
								<option value="Approval">Approval</option>
								<option value="Disposal">Disposal</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
								Aksi:
							</span>
							<select
								value={actionFilter}
								onChange={(e) => setActionFilter(e.target.value)}
								className="bg-white border border-gray-300 rounded px-3 py-1.5 text-[13px] text-gray-700 outline-none focus:border-[#0A356A] cursor-pointer font-medium"
							>
								<option value="Semua">Semua Aksi</option>
								<option value="CREATE">Pembuatan</option>
								<option value="UPDATE">Pembaruan</option>
								<option value="APPROVE">Persetujuan</option>
								<option value="REJECT">Penolakan</option>
								<option value="INSPECT">Inspeksi</option>
								<option value="REVIEW">Review</option>
							</select>
						</div>
					</div>
				)}
			</div>

			{/* Area Tabel */}
			<div className="bg-white border-x border-b border-gray-200 rounded-b shadow-sm overflow-hidden">
				<table className="w-full table-fixed text-left border-collapse">
					<thead className="bg-gray-50/80 border-b border-gray-200">
						<tr>
							<th className="w-[12%] px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
								Waktu
							</th>
							<th className="w-[14%] px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
								Aktor
							</th>
							<th className="w-[15%] px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
								Modul / Aksi
							</th>
							<th className="w-[17%] px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
								Entitas
							</th>
							<th className="w-[27%] px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
								Deskripsi
							</th>
							<th className="w-[15%] px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">
								Perubahan
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100 bg-white">
						{isLoading ? (
							<tr>
								<td colSpan={6} className="px-6 py-12 text-center">
									<RefreshCw className="w-6 h-6 text-[#0A356A] animate-spin mx-auto mb-2" />
									<p className="text-[13px] font-medium text-gray-600">
										Memuat data audit trail...
									</p>
								</td>
							</tr>
						) : paginatedLogs.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-6 py-12 text-center">
									<AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
									<p className="text-sm font-semibold text-gray-600">
										Tidak ada data ditemukan
									</p>
									<p className="text-xs text-gray-400 mt-1">
										Coba sesuaikan filter pencarian.
									</p>
								</td>
							</tr>
						) : (
							paginatedLogs.map((log) => {
								const config =
									actionTypeConfig[log.actionType] || actionTypeConfig.REVIEW;
								return (
									<tr
										key={log.id}
										className="hover:bg-[#F2F3F4] transition-colors duration-[140ms] ease-out"
									>
										<td className="px-3 py-3 text-[12px] text-[#64748B] leading-snug">
											{formatDate(log.timestamp)}
										</td>
										<td className="px-3 py-3">
											<p
												className="text-[13px] font-semibold text-[#0F172A] truncate"
												title={log.actor}
											>
												{log.actor}
											</p>
											<p
												className="text-[12px] text-[#64748B] truncate"
												title={log.actorRole}
											>
												{log.actorRole}
											</p>
										</td>
										<td className="px-3 py-3">
											<p
												className="text-[12px] text-[#64748B] truncate"
												title={log.module}
											>
												{log.module}
											</p>
											<span
												className={`inline-flex mt-0.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold whitespace-nowrap ${config.badge}`}
											>
												{log.action}
											</span>
										</td>
										<td className="px-3 py-3">
											<p
												className="text-[13px] font-semibold text-[#0A356A] truncate"
												title={log.entityCode}
											>
												{log.entityCode}
											</p>
											<p
												className="text-[12px] text-[#64748B] truncate"
												title={log.entityName}
											>
												{log.entityName}
											</p>
										</td>
										<td className="px-3 py-3">
											<p
												className="text-[12px] text-[#475569] leading-snug line-clamp-2"
												title={log.description}
											>
												{log.description}
											</p>
										</td>
										<td className="px-3 py-3 text-center">
											{log.oldValue &&
											log.newValue &&
											log.oldValue !== log.newValue &&
											log.oldValue !== "-" ? (
												<div className="flex flex-wrap items-center justify-center gap-1 text-[11px]">
													<span className="bg-[#F2F3F4] text-[#475569] px-2 py-0.5 rounded-sm whitespace-nowrap">
														{log.oldValue}
													</span>
													<span className="text-[#64748B]" aria-hidden="true">
														→
													</span>
													<span className="bg-white border border-[#0556B3]/30 text-[#0556B3] font-semibold px-2 py-0.5 rounded-sm whitespace-nowrap">
														{log.newValue}
													</span>
												</div>
											) : log.newValue ? (
												<span className="inline-flex items-center justify-center text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-white border border-[#0556B3]/30 text-[#0556B3] whitespace-nowrap">
													{log.newValue}
												</span>
											) : (
												<span className="text-[#64748B] text-xs">-</span>
											)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>

				{/* Pagination */}
				{!isLoading && filteredLogs.length > 0 && (
					<div className="px-6 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
						<span className="text-[12px] font-medium text-gray-500">
							Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
							{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} dari{" "}
							{filteredLogs.length} data (10 baris/halaman)
						</span>
						{totalPages > 1 && (
							<div className="flex items-center gap-1.5">
								<button
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								>
									Prev
								</button>
								<div className="flex items-center gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map(
										(page) => (
											<button
												key={page}
												onClick={() => setCurrentPage(page)}
												className={`w-7 h-7 rounded text-[12px] font-bold flex items-center justify-center transition-colors ${
													currentPage === page
														? "bg-[#0A356A] text-white"
														: "text-gray-600 hover:bg-gray-100"
												}`}
											>
												{page}
											</button>
										),
									)}
								</div>
								<button
									onClick={() =>
										setCurrentPage((p) => Math.min(totalPages, p + 1))
									}
									disabled={currentPage === totalPages}
									className="px-3 py-1 text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								>
									Next
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
