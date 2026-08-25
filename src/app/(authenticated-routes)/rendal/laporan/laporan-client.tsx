"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	Search,
	RefreshCw,
	Download,
	ChevronRight,
	FileText,
	Plus,
	Edit3,
	AlertCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export interface AuditLogEntry {
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

const actionTypeConfig: Record<string, { badge: string }> = {
	CREATE: { badge: "bg-blue-50 text-blue-700 border border-blue-200" },
	UPDATE: { badge: "bg-amber-50 text-amber-700 border border-amber-200" },
	DELETE: { badge: "bg-red-50 text-red-700 border border-red-200" },
	APPROVE: {
		badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
	},
	REJECT: { badge: "bg-purple-50 text-purple-700 border border-purple-200" },
	INSPECT: { badge: "bg-cyan-50 text-cyan-700 border border-cyan-200" },
	UPLOAD: { badge: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
	REVIEW: { badge: "bg-gray-50 text-gray-700 border border-gray-200" },
};

/** Client Component: interaksi (search/filter/paginasi/export) — data di-fetch Server Component. */
export default function RendalLaporanClient({
	logs,
}: {
	logs: AuditLogEntry[];
}) {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [moduleFilter, setModuleFilter] = useState("Semua");
	const [actionFilter, setActionFilter] = useState("Semua");
	const [currentPage, setCurrentPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	const filteredLogs = useMemo(() => {
		const query = search.toLowerCase().trim();
		return logs.filter((log) => {
			const matchSearch =
				!query ||
				log.entityCode.toLowerCase().includes(query) ||
				log.entityName.toLowerCase().includes(query) ||
				log.actor.toLowerCase().includes(query) ||
				log.description.toLowerCase().includes(query);
			const matchModule = moduleFilter === "Semua" || log.module === moduleFilter;
			const matchAction =
				actionFilter === "Semua" || log.actionType === actionFilter;
			return matchSearch && matchModule && matchAction;
		});
	}, [logs, search, moduleFilter, actionFilter]);

	const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
	// Halaman dijepit ke rentang valid, jadi filter tidak perlu me-reset
	// currentPage lewat effect.
	const page = Math.min(currentPage, totalPages);
	const paginatedLogs = useMemo(() => {
		const startIndex = (page - 1) * ITEMS_PER_PAGE;
		return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [filteredLogs, page]);

	const handleReset = () => {
		setSearch("");
		setSearchInput("");
		setModuleFilter("Semua");
		setActionFilter("Semua");
		setCurrentPage(1);
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
			formatDateTime(log.timestamp),
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
		<div className="max-w-7xl mx-auto pt-2 pb-8">
			{/* Header */}
			<div className="mb-4">
				<div className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-1">
					<span>Rendal Pemeliharaan</span>
					<ChevronRight className="w-3.5 h-3.5" />
					<span className="text-[#0A356A] font-semibold">Log Audit Trail</span>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">
							Laporan Log Audit Trail
						</h1>
						<p className="text-[13px] text-gray-500 mt-1">
							Pelacakan seluruh aktivitas perubahan data aset secara transparan dan
							terverifikasi.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => router.refresh()}
							className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Muat Ulang
						</button>
						<button
							onClick={handleExport}
							className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A356A] hover:bg-[#062854] text-white rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
						>
							<Download className="w-3.5 h-3.5" />
							Export CSV
						</button>
					</div>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
				<div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
					<div className="flex items-center gap-2 mb-1.5">
						<div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
							<FileText className="w-3.5 h-3.5 text-blue-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Total Log
						</span>
					</div>
					<p className="text-xl font-bold text-gray-900">{stats.total}</p>
				</div>
				<div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
					<div className="flex items-center gap-2 mb-1.5">
						<div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
							<Plus className="w-3.5 h-3.5 text-emerald-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Pembuatan
						</span>
					</div>
					<p className="text-xl font-bold text-gray-900">{stats.create}</p>
				</div>
				<div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
					<div className="flex items-center gap-2 mb-1.5">
						<div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
							<Edit3 className="w-3.5 h-3.5 text-amber-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Pembaruan
						</span>
					</div>
					<p className="text-xl font-bold text-gray-900">{stats.update}</p>
				</div>
				<div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
					<div className="flex items-center gap-2 mb-1.5">
						<div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center">
							<FileText className="w-3.5 h-3.5 text-cyan-600" />
						</div>
						<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
							Inspeksi
						</span>
					</div>
					<p className="text-xl font-bold text-gray-900">{stats.inspect}</p>
				</div>
			</div>

			{/* Main Table Card */}
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden scroll-mt-4">
				{/* Toolbar */}
				<div className="p-3 border-b border-gray-200 bg-white flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
					<div className="flex w-full lg:w-auto gap-2">
						<div className="relative flex-1 lg:w-80">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Cari kode, nama, aktor, deskripsi..."
								value={searchInput}
								onChange={(e) => {
									setSearchInput(e.target.value);
									setSearch(e.target.value);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") setSearch(searchInput);
								}}
								className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400"
							/>
						</div>
						<button
							onClick={() => setSearch(searchInput)}
							className="px-3 py-1.5 bg-[#0A356A] text-white text-[13px] font-medium rounded-lg hover:bg-[#062854] transition-colors whitespace-nowrap shadow-sm"
						>
							Cari
						</button>
					</div>

					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<select
							value={moduleFilter}
							onChange={(e) => setModuleFilter(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="Semua">Semua Modul</option>
							<option value="Equipment">Equipment</option>
							<option value="Inspection">Inspection</option>
							<option value="Approval">Approval</option>
							<option value="Disposal">Disposal</option>
						</select>

						<select
							value={actionFilter}
							onChange={(e) => setActionFilter(e.target.value)}
							className="px-3 py-1.5 text-[13px] bg-white border border-gray-200 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none text-gray-700 min-w-[120px] cursor-pointer"
						>
							<option value="Semua">Semua Aksi</option>
							<option value="CREATE">Pembuatan</option>
							<option value="UPDATE">Pembaruan</option>
							<option value="APPROVE">Persetujuan</option>
							<option value="REJECT">Penolakan</option>
							<option value="INSPECT">Inspeksi</option>
							<option value="REVIEW">Review</option>
						</select>

						<div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>

						<button
							onClick={handleReset}
							className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
							title="Reset semua filter"
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Reset
						</button>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-gray-50/95 backdrop-blur-sm">
							<tr className="border-b border-gray-300">
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Waktu
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Aktor
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Modul / Aksi
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Entitas
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-left whitespace-nowrap">
									Deskripsi
								</th>
								<th className="px-3 py-3 text-[14px] font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap">
									Perubahan
								</th>
							</tr>
						</thead>
						<tbody className="bg-white">
							{paginatedLogs.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-5 py-12 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<AlertCircle className="w-6 h-6 text-gray-300 mb-2" />
											<p className="text-[13px] font-medium text-gray-900">
												Data Tidak Ditemukan
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Coba sesuaikan filter pencarian.
											</p>
										</div>
									</td>
								</tr>
							) : (
								paginatedLogs.map((log) => {
									const config =
										actionTypeConfig[log.actionType] || actionTypeConfig.REVIEW;
									return (
										<tr
											key={log.id}
											className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group"
										>
											<td className="px-3 py-3 text-[14px] text-gray-500 whitespace-nowrap">
												{formatDateTime(log.timestamp)}
											</td>
											<td className="px-3 py-3 whitespace-nowrap">
												<p
													className="text-[14px] font-semibold text-gray-900 truncate"
													title={log.actor}
												>
													{log.actor}
												</p>
												<p
													className="text-[12px] text-gray-500 truncate"
													title={log.actorRole}
												>
													{log.actorRole}
												</p>
											</td>
											<td className="px-3 py-3 whitespace-nowrap">
												<p
													className="text-[12px] text-gray-500 truncate"
													title={log.module}
												>
													{log.module}
												</p>
												<span
													className={`inline-flex mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${config.badge}`}
												>
													{log.action}
												</span>
											</td>
											<td className="px-3 py-3 whitespace-nowrap">
												<p
													className="text-[14px] font-semibold text-[#0A356A] truncate"
													title={log.entityCode}
												>
													{log.entityCode}
												</p>
												<p
													className="text-[12px] text-gray-500 truncate"
													title={log.entityName}
												>
													{log.entityName}
												</p>
											</td>
											<td className="px-3 py-3">
												<p
													className="text-[13px] text-gray-700 leading-snug line-clamp-2"
													title={log.description}
												>
													{log.description}
												</p>
											</td>
											<td className="px-3 py-3 text-center whitespace-nowrap">
												{log.oldValue &&
												log.newValue &&
												log.oldValue !== log.newValue &&
												log.oldValue !== "-" ? (
													<div className="flex flex-wrap items-center justify-center gap-1 text-[11px]">
														<span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
															{log.oldValue}
														</span>
														<span className="text-gray-400" aria-hidden="true">
															→
														</span>
														<span className="bg-blue-50 border border-blue-200 text-[#0A356A] font-bold px-2 py-0.5 rounded">
															{log.newValue}
														</span>
													</div>
												) : log.newValue ? (
													<span className="inline-flex items-center justify-center text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[#0A356A]">
														{log.newValue}
													</span>
												) : (
													<span className="text-gray-400 text-xs">-</span>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{filteredLogs.length > 0 && (
					<div className="px-5 py-3 border-t border-gray-200 bg-white flex justify-between items-center">
						<span className="text-[11px] font-medium text-gray-500">
							Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1} -{" "}
							{Math.min(page * ITEMS_PER_PAGE, filteredLogs.length)} dari{" "}
							{filteredLogs.length} data ({ITEMS_PER_PAGE} baris/halaman)
						</span>
						<div className="flex items-center gap-1.5">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Prev
							</button>
							<div className="flex items-center gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-colors ${
											currentPage === page
												? "bg-[#0A356A] text-white"
												: "text-gray-600 hover:bg-gray-100"
										}`}
									>
										{page}
									</button>
								))}
							</div>
							<button
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
								className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
