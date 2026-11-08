"use client";

import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
	Server,
	Clock,
	CheckCircle2,
	Wrench,
	ArrowRight,
	AlertCircle,
	Check,
	Building2,
	ChevronRight,
	X,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
	statusGroup,
	statusBadgeStyle,
	statusText,
	statusName,
	isPendingStatus,
	isReadyStatus,
	isRepairStatus,
	isScrapStatus,
} from "@/lib/equipment-status";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface RendalDashboardClientProps {
	equipments: any[];
	scraps: any[];
	revalidations: any[];
	plants?: any[];
}

export default function RendalDashboardClient({
	equipments,
	scraps,
	revalidations,
}: RendalDashboardClientProps) {
	const searchParams = useSearchParams();
	const urlStatus = searchParams?.get("status") || "ALL";
	const [prevUrlStatus, setPrevUrlStatus] = useState(urlStatus);
	const [statusFilter, setStatusFilter] = useState<string>(urlStatus);

	if (prevUrlStatus !== urlStatus) {
		setPrevUrlStatus(urlStatus);
		setStatusFilter(urlStatus);
	}

	const updateStatusFilter = useCallback((newStatus: string) => {
		setStatusFilter(newStatus);
		if (typeof window !== "undefined") {
			const url = new URL(window.location.href);
			if (newStatus && newStatus !== "ALL" && newStatus !== "Semua") {
				url.searchParams.set("status", newStatus);
			} else {
				url.searchParams.delete("status");
			}
			window.history.replaceState(null, "", url.toString());
		}
	}, []);

	// 1. Kategorisasi status aset operasional
	const scrapEquipmentIds = useMemo(
		() =>
			new Set(
				scraps
					.map((d: any) => String(d.equipment_id || d.equipment?.id || d.id))
					.filter(Boolean),
			),
		[scraps],
	);

	const {
		menungguValidasiCount,
		dalamPerbaikanCount,
		readyCount,
		scrapCount,
		reusedCount,
		menungguRevalidasiCount,
	} = useMemo(() => {
		let menungguValidasi = 0;
		let dalamPerbaikan = 0;
		let ready = 0;
		let scrap = 0;
		let reused = 0;

		equipments.forEach((e: any) => {
			const eqId = String(e.id || "");
			const group = statusGroup(e);

			if (group === "scrap" || scrapEquipmentIds.has(eqId)) {
				scrap++;
			} else if (group === "repair") {
				dalamPerbaikan++;
			} else if (group === "ready") {
				ready++;
			} else if (group === "reused") {
				reused++;
			} else {
				menungguValidasi++;
			}
		});

		// Menunggu persetujuan revalidasi di rendal
		const revalPending = revalidations.filter(
			(r: any) => r.approval_status === "PENDING" || !r.approval_status,
		).length;

		return {
			menungguValidasiCount: menungguValidasi,
			dalamPerbaikanCount: dalamPerbaikan,
			readyCount: ready,
			scrapCount: scrap,
			reusedCount: reused,
			menungguRevalidasiCount: revalPending,
		};
	}, [equipments, scrapEquipmentIds, revalidations]);

	const totalUnit = equipments.length;

	// Penentuan kondisi aktif kartu ringkasan status di dashboard (AC 1, AC 3)
	const isAllActive = statusFilter === "ALL" || statusFilter === "Semua" || !statusFilter;
	const isPendingActive =
		!isAllActive &&
		(statusFilter === "VALIDATED" ||
			statusFilter === "REGISTERED" ||
			statusFilter === "MENUNGGU_VALIDASI");
	const isReadyActive =
		!isAllActive &&
		(statusFilter === "READY_TO_USE" ||
			statusFilter === "READY TO USE" ||
			statusFilter === "SIAP DIGUNAKAN");
	const isRepairActive =
		!isAllActive &&
		(statusFilter === "REPAIR" ||
			statusFilter === "REPAIR_VENDOR" ||
			statusFilter === "REPAIR_COMPLETED" ||
			statusFilter === "REVALIDATION" ||
			statusFilter === "DALAM_PERBAIKAN");
	const isScrapActive =
		!isAllActive &&
		(statusFilter === "SCRAP" ||
			statusFilter === "SCRAP_RECOMMENDED" ||
			statusFilter === "SCRAP_RECOMMENDED" ||
			statusFilter === "SCRAP_RECOMENDED");

	const handleCardClick = (targetStatus: string) => {
		let nextStatus = targetStatus;
		if (targetStatus === "ALL" || targetStatus === "Semua") {
			nextStatus = "ALL";
		} else if (
			(targetStatus === "READY_TO_USE" && isReadyActive) ||
			(targetStatus === "REPAIR" && isRepairActive) ||
			(targetStatus === "SCRAP" && isScrapActive) ||
			(targetStatus === "VALIDATED" && isPendingActive) ||
			statusFilter === targetStatus
		) {
			// Toggle off jika diklik ulang (AC 3)
			nextStatus = "ALL";
		}
		updateStatusFilter(nextStatus);
	};

	// 2. Data Donut Chart (Distribusi Status Operasional)
	const pieData = useMemo(() => {
		const data = [
			{ name: "Menunggu Validasi", value: menungguValidasiCount, color: "#0556B3" },
			{ name: "Siap Digunakan", value: readyCount, color: "#059669" },
			{ name: "Dalam Perbaikan", value: dalamPerbaikanCount, color: "#B45309" },
			{ name: "Scrap", value: scrapCount, color: "#DC2626" },
			{ name: "Sudah Digunakan", value: reusedCount, color: "#4F46E5" },
		].filter((item) => item.value > 0);

		if (data.length === 0) {
			data.push({ name: "Belum Ada Data", value: 1, color: "#E6E8EA" });
		}
		return data;
	}, [menungguValidasiCount, readyCount, dalamPerbaikanCount, scrapCount, reusedCount]);

	// 3. Sebaran Aset per Plant
	const plantDistribution = useMemo(() => {
		const countMap: Record<string, number> = {};
		equipments.forEach((e: any) => {
			const plantName =
				(typeof e.plant === "object" ? e.plant?.name : e.plant) ||
				e.plant_description ||
				"Lainnya";
			if (plantName && plantName !== "-") {
				countMap[plantName] = (countMap[plantName] || 0) + 1;
			}
		});

		return Object.entries(countMap)
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);
	}, [equipments]);

	// 4. Registrasi Aset (difilter jika ada KPI card aktif, default 5 teratas)
	const filteredEquipmentsForTable = useMemo(() => {
		let list = equipments;
		if (statusFilter && statusFilter !== "ALL" && statusFilter !== "Semua") {
			const filterNorm = statusName(statusFilter);
			list = equipments.filter((e: any) => {
				const eqId = String(e.id || "");
				const rawStatus =
					(typeof e.status === "string" ? e.status : e.status?.name) ||
					e.statusAset ||
					"";
				if (filterNorm === "READY_TO_USE") {
					return isReadyStatus(rawStatus);
				}
				if (filterNorm === "REPAIR") {
					return isRepairStatus(rawStatus);
				}
				if (filterNorm === "SCRAP" || filterNorm === "SCRAP_RECOMMENDED") {
					return isScrapStatus(rawStatus) || scrapEquipmentIds.has(eqId);
				}
				if (filterNorm === "VALIDATED" || filterNorm === "REGISTERED") {
					return isPendingStatus(rawStatus);
				}
				return statusName(rawStatus) === filterNorm;
			});
		}

		return [...list].sort((a: any, b: any) => {
			const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
			const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
			if (timeB !== timeA) return timeB - timeA;
			return (Number(b.id) || 0) - (Number(a.id) || 0);
		});
	}, [equipments, statusFilter, scrapEquipmentIds]);

	const recentEquipments = useMemo(() => {
		return filteredEquipmentsForTable.slice(0, 5);
	}, [filteredEquipmentsForTable]);

	// KPI Cards specification (DESIGN.md: 2px left border rule, value-dominant - US-12-FE)
	const kpis = [
		{
			label: "Total Aset Terdaftar",
			value: totalUnit,
			caption: "Total inventaris idle tercatat",
			rule: "#334155",
			icon: Server,
			statusKey: "ALL",
			isActive: isAllActive,
			activeBg: "bg-slate-50 border-slate-300 ring-slate-600",
			badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
		},
		{
			label: "Menunggu Validasi",
			value: menungguValidasiCount,
			caption: "Baru masuk, antrean inspeksi",
			rule: "#0556B3",
			icon: Clock,
			statusKey: "VALIDATED",
			isActive: isPendingActive,
			activeBg: "bg-blue-50/70 border-blue-300 ring-[#0556B3]",
			badgeColor: "bg-blue-100 text-[#0556B3] border-blue-200",
		},
		{
			label: "Siap Digunakan",
			value: readyCount,
			caption: "Tervalidasi di pool idle",
			rule: "#059669",
			icon: CheckCircle2,
			statusKey: "READY_TO_USE",
			isActive: isReadyActive,
			activeBg: "bg-emerald-50/70 border-emerald-300 ring-[#059669]",
			badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
		},
		{
			label: "Dalam Perbaikan",
			value: dalamPerbaikanCount,
			caption: "Sedang dalam servis/reparasi",
			rule: "#B45309",
			icon: Wrench,
			statusKey: "REPAIR",
			isActive: isRepairActive,
			activeBg: "bg-amber-50/70 border-amber-300 ring-[#B45309]",
			badgeColor: "bg-amber-100 text-[#B45309] border-amber-200",
		},
		{
			label: "Rekomendasi Scrap",
			value: scrapCount,
			caption: "Rusak berat atau usulan afkir",
			rule: "#DC2626",
			icon: AlertCircle,
			statusKey: "SCRAP",
			isActive: isScrapActive,
			activeBg: "bg-red-50/70 border-red-300 ring-[#DC2626]",
			badgeColor: "bg-red-100 text-red-700 border-red-200",
		},
	];

	return (
		<div className="flex flex-col gap-6">
			{/* 1. Operational KPI Strip (Interactive Quick Filter Shortcuts - US-12-FE) */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
				{kpis.map((kpi) => (
					<div
						key={kpi.label}
						role="button"
						tabIndex={0}
						aria-pressed={kpi.isActive}
						aria-label={`Filter status: ${kpi.label}, ${kpi.value} peralatan`}
						onClick={() => handleCardClick(kpi.statusKey)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleCardClick(kpi.statusKey);
							}
						}}
						className={`rounded border border-l-2 p-4 flex items-start justify-between gap-3 cursor-pointer select-none transition-all duration-200 ${
							kpi.isActive
								? `${kpi.activeBg} ring-2 ring-offset-1 shadow-sm`
								: "bg-white border-[#E6E8EA] hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
						}`}
						style={{ borderLeftColor: kpi.rule }}
					>
						<div className="min-w-0">
							<div className="flex items-center gap-1.5">
								<p className="text-[12px] font-medium text-[#64748B] truncate">
									{kpi.label}
								</p>
								{kpi.isActive && kpi.statusKey !== "ALL" && (
									<span
										className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded border ${kpi.badgeColor}`}
									>
										<Check className="w-2.5 h-2.5 stroke-[3]" />
										Aktif
									</span>
								)}
							</div>
							<p className="text-[28px] leading-none font-semibold text-[#0F172A] tabular-nums mt-2 tracking-[-0.02em]">
								{kpi.value}
							</p>
							<p className="text-[12px] text-[#64748B] mt-1.5">{kpi.caption}</p>
						</div>
						<kpi.icon
							className="w-4 h-4 shrink-0 mt-0.5"
							style={{ color: kpi.rule }}
							aria-hidden="true"
						/>
					</div>
				))}
			</div>

			{/* 2. Middle Row: Antrean Tindak Lanjut & Registrasi Terkini (Left 2 cols) vs Status & Plant (Right 1 col) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column (2 cols) */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					{/* Tindak Lanjut Operasional */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
								<AlertCircle className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
								Antrean & Tindak Lanjut Operasional
							</h3>
							<span className="text-[11px] text-[#64748B] font-medium">
								Prioritas Penanganan Rendal
							</span>
						</div>

						<div className="divide-y divide-[#E6E8EA] border-t border-[#E6E8EA]">
							{menungguValidasiCount > 0 && (
								<div className="flex items-center justify-between gap-3 py-3 text-[13px]">
									<div className="flex items-start gap-2.5">
										<span className="w-1 h-8 rounded-full bg-[#0556B3] shrink-0" />
										<div>
											<p className="font-semibold text-[#0F172A]">
												{menungguValidasiCount} aset dalam antrean / proses validasi
											</p>
											<p className="text-[12px] text-[#64748B] mt-0.5">
												Aset baru diregistrasi atau dalam tahapan validasi teknis.
											</p>
										</div>
									</div>
									<Link
										href="/rendal/idle"
										className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0A356A] hover:text-[#0556B3] whitespace-nowrap bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition-colors"
									>
										<span>Cek Data</span>
										<ChevronRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							)}

							{menungguRevalidasiCount > 0 && (
								<div className="flex items-center justify-between gap-3 py-3 text-[13px]">
									<div className="flex items-start gap-2.5">
										<span className="w-1 h-8 rounded-full bg-[#B45309] shrink-0" />
										<div>
											<p className="font-semibold text-[#0F172A]">
												{menungguRevalidasiCount} validasi ulang (Menunggu Approval Manajer)
											</p>
											<p className="text-[12px] text-[#64748B] mt-0.5">
												Perbaikan alat telah lolos inspeksi ulang dan menunggu persetujuan final Manajer Rendal.
											</p>
										</div>
									</div>
									<Link
										href="/rendal/validasi-ulang"
										className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#B45309] hover:text-[#92400E] whitespace-nowrap bg-amber-50 px-2.5 py-1 rounded hover:bg-amber-100 transition-colors"
									>
										<span>Monitoring</span>
										<ChevronRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							)}

							{scrapCount > 0 && (
								<div className="flex items-center justify-between gap-3 py-3 text-[13px]">
									<div className="flex items-start gap-2.5">
										<span className="w-1 h-8 rounded-full bg-[#DC2626] shrink-0" />
										<div>
											<p className="font-semibold text-[#0F172A]">
												{scrapCount} aset berstatus rekomendasi scrap
											</p>
											<p className="text-[12px] text-[#64748B] mt-0.5">
												Peralatan rusak berat yang perlu diajukan proses penghapusan buku ke Manajer.
											</p>
										</div>
									</div>
									<Link
										href="/rendal/scrap"
										className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#DC2626] hover:text-[#B91C1C] whitespace-nowrap bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition-colors"
									>
										<span>Lihat Scrap</span>
										<ChevronRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							)}

							{menungguValidasiCount === 0 &&
								menungguRevalidasiCount === 0 &&
								scrapCount === 0 && (
									<div className="flex items-center gap-2 text-[13px] text-[#059669] py-4">
										<Check className="w-4 h-4 shrink-0" aria-hidden="true" />
										<span className="font-medium">
											Semua antrean operasional inventaris saat ini dalam kondisi tertangani.
										</span>
									</div>
								)}
						</div>
					</div>

					{/* Tabel Registrasi Aset Terkini */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5 flex flex-col justify-between">
						<div>
							<div className="flex items-center justify-between mb-3">
								<div>
									<div className="flex items-center gap-2">
										<h3 className="text-[14px] font-semibold text-[#0F172A]">
											Registrasi Aset Terkini
										</h3>
										{!isAllActive && (
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#0A356A] border border-blue-200">
												Filter: {kpis.find((k) => k.statusKey === statusFilter)?.label || statusFilter} ({filteredEquipmentsForTable.length} unit)
												<button
													type="button"
													onClick={() => handleCardClick(statusFilter)}
													className="text-blue-500 hover:text-blue-800 ml-0.5"
													title="Hapus filter"
												>
													<X className="w-3 h-3" />
												</button>
											</span>
										)}
									</div>
									<p className="text-[12px] text-[#64748B] mt-0.5">
										{!isAllActive
											? `Menampilkan peralatan yang difilter berdasarkan kartu status ${kpis.find((k) => k.statusKey === statusFilter)?.label}`
											: "5 peralatan terakhir yang didaftarkan ke sistem manajemen idle"}
									</p>
								</div>
								<Link
									href={!isAllActive ? `/rendal/idle?status=${statusFilter}` : "/rendal/idle"}
									className="text-[12px] font-semibold text-[#0A356A] hover:text-[#0556B3] flex items-center gap-1"
								>
									<span>Lihat Semua{!isAllActive ? ` (${filteredEquipmentsForTable.length})` : ""}</span>
									<ArrowRight className="w-3.5 h-3.5" />
								</Link>
							</div>

							<div className="overflow-x-auto border-t border-[#E6E8EA]">
								<table className="w-full text-left text-[12px] border-collapse">
									<thead>
										<tr className="border-b border-[#E6E8EA] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider bg-gray-50/50">
											<th className="py-2.5 px-3">Kode Alat</th>
											<th className="py-2.5 px-3">Nama Peralatan</th>
											<th className="py-2.5 px-3">Plant</th>
											<th className="py-2.5 px-3">Lokasi Penyimpanan</th>
											<th className="py-2.5 px-3 text-center">Status</th>
											<th className="py-2.5 px-3 text-right">Tgl Registrasi</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#E6E8EA]">
										{recentEquipments.length === 0 ? (
											<tr>
												<td colSpan={6} className="py-6 text-center text-[#64748B]">
													Belum ada data registrasi peralatan.
												</td>
											</tr>
										) : (
											recentEquipments.map((item: any, idx: number) => {
												const code =
													item.equipment_code || item.kodeAlat || `EQ-${item.id}`;
												const name = item.name || item.namaAlat || "Tanpa Nama";
												const plant =
													(typeof item.plant === "object"
														? item.plant?.name
														: item.plant) ||
													item.plant_description ||
													"-";
												const storage =
													(typeof item.storage_location === "object"
														? item.storage_location?.name
														: item.storage_location) || "-";
												const rawStatus =
													(typeof item.status === "string"
														? item.status
														: item.status?.name) || "REGISTERED";
												const dateStr = item.created_at
													? new Date(item.created_at).toISOString().split("T")[0]
													: "-";

												return (
													<tr
														key={item.id || idx}
														className="hover:bg-gray-50/60 transition-colors"
													>
														<td className="py-2.5 px-3 font-semibold text-[#0A356A]">
															{code}
														</td>
														<td className="py-2.5 px-3 font-medium text-[#0F172A] max-w-[180px] truncate" title={name}>
															{name}
														</td>
														<td className="py-2.5 px-3 text-[#475569]">{plant}</td>
														<td className="py-2.5 px-3 text-[#475569] max-w-[140px] truncate" title={storage}>
															{storage}
														</td>
														<td className="py-2.5 px-3 text-center">
															<span
																className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${statusBadgeStyle(rawStatus)}`}
															>
																{statusText(rawStatus)}
															</span>
														</td>
														<td className="py-2.5 px-3 text-right text-[#64748B] tabular-nums">
															{dateStr}
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column (1 col) */}
				<div className="flex flex-col gap-6">
					{/* Donut Status Operasional */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5 flex flex-col justify-between">
						<div>
							<h3 className="text-[14px] font-semibold text-[#0F172A]">
								Status Inventaris Aset
							</h3>
							<p className="text-[11px] text-[#64748B] mt-0.5">
								Komposisi kondisi operasional aset idle saat ini
							</p>
						</div>

						<div className="relative h-44 flex justify-center items-center my-3">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={72}
										paddingAngle={2}
										dataKey="value"
										stroke="none"
									>
										{pieData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											borderRadius: "4px",
											border: "1px solid #E6E8EA",
											boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
											fontSize: "12px",
										}}
										formatter={(value) => `${value} Unit`}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
								<span className="text-2xl font-bold text-[#0F172A] tabular-nums">
									{totalUnit}
								</span>
								<span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider">
									Total Aset
								</span>
							</div>
						</div>

						<div className="space-y-2 border-t border-[#E6E8EA] pt-3">
							{pieData.map((item) => (
								<div
									key={item.name}
									className="flex justify-between items-center text-[12px]"
								>
									<div className="flex items-center gap-2">
										<span
											className="w-2.5 h-2.5 rounded-full shrink-0"
											style={{ backgroundColor: item.color }}
										/>
										<span className="text-[#475569] font-medium">{item.name}</span>
									</div>
									<span className="font-semibold text-[#0F172A] tabular-nums bg-gray-50 px-2 py-0.5 rounded border border-[#E6E8EA] text-[11px]">
										{item.value} Unit (
										{totalUnit > 0 ? Math.round((item.value / totalUnit) * 100) : 0}
										%)
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Sebaran Aset per Plant */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-1.5">
								<Building2 className="w-4 h-4 text-[#475569]" />
								Sebaran Aset per Plant
							</h3>
							<span className="text-[11px] text-[#64748B]">Top 5 Area</span>
						</div>

						<div className="space-y-3 border-t border-[#E6E8EA] pt-3">
							{plantDistribution.length === 0 ? (
								<p className="text-[12px] text-[#64748B] text-center py-3">
									Belum ada data sebaran plant.
								</p>
							) : (
								plantDistribution.map((item) => {
									const pct =
										totalUnit > 0 ? Math.round((item.count / totalUnit) * 100) : 0;
									return (
										<div key={item.name} className="space-y-1">
											<div className="flex justify-between items-center text-[12px]">
												<span className="font-medium text-[#0F172A] truncate max-w-[170px]" title={item.name}>
													{item.name}
												</span>
												<span className="text-[#64748B] font-semibold tabular-nums text-[11px]">
													{item.count} unit ({pct}%)
												</span>
											</div>
											<div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
												<div
													className="h-full bg-[#0A356A] rounded-full transition-all duration-300"
													style={{ width: `${Math.min(pct, 100)}%` }}
												/>
											</div>
										</div>
									);
								})
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
