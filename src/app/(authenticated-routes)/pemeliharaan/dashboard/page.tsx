"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getEquipments } from "@/action/api";
import {
	Loader2,
	RefreshCw,
	ArrowRight,
	ChevronRight,
	Check,
} from "lucide-react";
import {
	repairFlowStatus,
	REPAIR_STATUS_LABEL,
	formatPlantDisplay,
	formatCondition,
	type RepairFlowStatus,
} from "@/lib/equipment-status";
import { buttonVariants } from "@/components/ui/button";

interface Equipment {
	id: number;
	name?: string;
	equipment_code?: string;
	status?: { id: number; name: string };
	condition?: { id: number; name: string };
	plant?: { id: number; name: string } | string;
	plant_description?: string;
	storage_location?: { id: number; name: string } | string;
	notes?: string;
	updated_at?: string;
	created_at?: string;
}

function str(val: unknown): string {
	if (val == null) return "-";
	if (typeof val === "string") return val;
	if (typeof val === "object") {
		const name = (val as Record<string, unknown>).name;
		if (typeof name === "string") return name;
	}
	return String(val);
}

function relativeTime(dateStr?: string): string {
	if (!dateStr) return "-";
	const diffDays = Math.floor(
		(Date.now() - new Date(dateStr).getTime()) / 86_400_000,
	);
	if (diffDays <= 0) return "Hari ini";
	if (diffDays === 1) return "Kemarin";
	if (diffDays < 7) return `${diffDays} hari lalu`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
	return `${Math.floor(diffDays / 30)} bulan lalu`;
}

/** DESIGN.md status hues — five workflow states, no sixth. */
const STATUS_COLOR: Record<RepairFlowStatus, string> = {
	REPAIR: "#B45309",
	REPAIR_COMPLETED: "#0556B3",
	REVALIDATION: "#475569",
	READY_TO_USE: "#059669",
	SCRAP: "#DC2626",
};

/** Siapa yang memegang aset di tiap tahap — alasan utama halaman ini dibuka. */
const STAGE_OWNER: Record<RepairFlowStatus, string> = {
	REPAIR: "Pemeliharaan Lapangan",
	REPAIR_COMPLETED: "Inspeksi Teknik",
	REVALIDATION: "Rendal Pemeliharaan",
	READY_TO_USE: "Selesai",
	SCRAP: "Rendal Pemeliharaan",
};

export default function PemeliharaanDashboardPage() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const eq = await getEquipments();
			setEquipments(Array.isArray(eq) ? eq : []);
		} catch (err) {
			console.error("Failed to load dashboard data:", err);
			setEquipments([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data awal saat mount
		loadData();
	}, []);

	const groups = useMemo(() => {
		const byStatus = new Map<RepairFlowStatus, Equipment[]>();
		for (const eq of equipments) {
			const status = repairFlowStatus(eq);
			if (!status) continue;
			const bucket = byStatus.get(status);
			if (bucket) bucket.push(eq);
			else byStatus.set(status, [eq]);
		}
		const of = (s: RepairFlowStatus) => byStatus.get(s) ?? [];
		return {
			antrean: of("REPAIR"),
			menungguValidasi: of("REPAIR_COMPLETED"),
			menungguRendal: of("REVALIDATION"),
			selesai: of("READY_TO_USE"),
			scrap: of("SCRAP"),
		};
	}, [equipments]);

	// Alur perbaikan itu berurutan, jadi dirender sebagai rail terurut —
	// bukan donut, yang justru membuang urutan tahapnya.
	const stages = useMemo(() => {
		const flow: [RepairFlowStatus, Equipment[]][] = [
			["REPAIR", groups.antrean],
			["REPAIR_COMPLETED", groups.menungguValidasi],
			["REVALIDATION", groups.menungguRendal],
			["READY_TO_USE", groups.selesai],
		];
		return flow.map(([status, items]) => ({
			status,
			count: items.length,
			label: REPAIR_STATUS_LABEL[status],
			owner: STAGE_OWNER[status],
			hue: STATUS_COLOR[status],
		}));
	}, [groups]);

	const totalInFlow = useMemo(
		() => stages.reduce((sum, s) => sum + s.count, 0),
		[stages],
	);

	const recentActivity = useMemo(() => {
		return equipments
			.filter((eq) => repairFlowStatus(eq) !== null)
			.sort(
				(a, b) =>
					new Date(b.updated_at || b.created_at || 0).getTime() -
					new Date(a.updated_at || a.created_at || 0).getTime(),
			)
			.slice(0, 6);
	}, [equipments]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh]">
				<Loader2
					className="w-5 h-5 text-[#0A356A] animate-spin mb-3"
					aria-hidden="true"
				/>
				<p className="text-[13px] text-[#64748B]">Memuat data dashboard...</p>
			</div>
		);
	}

	return (
		<div className="page-container">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Dashboard Pemeliharaan Lapangan</h1>
					<p className="page-subtitle">
						Posisi setiap aset dalam alur perbaikan, dari antrean sampai siap
						digunakan.
					</p>
				</div>
				<div className="header-actions">
					<button
						type="button"
						onClick={loadData}
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<RefreshCw className="w-4 h-4" aria-hidden="true" />
						Muat Ulang
					</button>
					<Link
						href="/pemeliharaan/perbaikan-alat"
						className={buttonVariants({ variant: "brand", size: "lg" })}
					>
						Kerjakan Antrean
						<ArrowRight className="w-4 h-4" aria-hidden="true" />
					</Link>
				</div>
			</div>

			{/* Stage rail — urutan tahap adalah informasinya, jadi dirender berurutan. */}
			<div className="bg-white border border-[#E6E8EA] rounded-[4px]">
				<div className="flex items-baseline justify-between gap-4 px-5 py-4 border-b border-[#E6E8EA]">
					<div>
						<h2 className="text-[14px] font-semibold text-[#0F172A]">
							Alur Perbaikan
						</h2>
						<p className="text-[12px] text-[#64748B] mt-0.5">
							Empat tahap berurutan. Angka besar menandai tahap yang menahan aset.
						</p>
					</div>
					<p className="text-[12px] text-[#64748B] tabular-nums shrink-0">
						{totalInFlow} aset dalam alur
					</p>
				</div>

				<ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E6E8EA]">
					{stages.map((stage, i) => (
						<li key={stage.status} className="p-5">
							<div
								className="h-0.5 w-8 mb-3"
								style={{ backgroundColor: stage.hue }}
								aria-hidden="true"
							/>
							<p className="text-[12px] text-[#64748B] tabular-nums">Tahap {i + 1}</p>
							<p className="text-[13px] font-semibold text-[#0F172A] mt-0.5">
								{stage.label}
							</p>
							<p className="text-[28px] font-semibold text-[#0F172A] tracking-[-0.02em] tabular-nums leading-tight mt-2">
								{stage.count}
							</p>
							<p className="text-[12px] text-[#64748B] mt-1">
								Ditangani {stage.owner}
							</p>
						</li>
					))}
				</ol>

				{groups.scrap.length > 0 && (
					<p className="px-5 py-3 border-t border-[#E6E8EA] text-[13px] text-[#475569]">
						<span
							className="inline-block w-0.5 h-3 mr-2 align-middle"
							style={{ backgroundColor: STATUS_COLOR.SCRAP }}
							aria-hidden="true"
						/>
						<span className="font-semibold text-[#0F172A] tabular-nums">
							{groups.scrap.length} aset
						</span>{" "}
						keluar dari alur ini dengan rekomendasi scrap.
					</p>
				)}
			</div>

			{/* Antrean per plant + aktivitas */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
				<div className="lg:col-span-2 bg-white border border-[#E6E8EA] rounded-[4px] flex flex-col justify-between">
					<div>
						<div className="px-5 py-4 border-b border-[#E6E8EA] flex items-center justify-between gap-2">
							<div>
								<h2 className="text-[14px] font-semibold text-[#0F172A]">
									Antrean Perbaikan Siap Dikerjakan
								</h2>
								<p className="text-[12px] text-[#64748B] mt-0.5">
									Daftar peralatan berstatus REPAIR yang memerlukan tindakan teknisi lapangan.
								</p>
							</div>
							<span className="text-[12px] font-semibold text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[2px] shrink-0 tabular-nums">
								{groups.antrean.length} Aset
							</span>
						</div>

						<div>
							{groups.antrean.length === 0 ? (
								<div className="flex items-center gap-2 py-12 justify-center text-[13px] text-[#475569]">
									<Check className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
									Antrean kosong. Tidak ada aset berstatus REPAIR.
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse">
										<thead>
											<tr className="bg-[#F2F3F4] border-b border-[#E6E8EA]">
												<th className="px-4 py-2.5 text-[11px] font-semibold text-[#475569] uppercase tracking-[0.04em] whitespace-nowrap">
													Kode Alat
												</th>
												<th className="px-4 py-2.5 text-[11px] font-semibold text-[#475569] uppercase tracking-[0.04em]">
													Nama Peralatan
												</th>
												<th className="px-4 py-2.5 text-[11px] font-semibold text-[#475569] uppercase tracking-[0.04em] whitespace-nowrap">
													Plant
												</th>
												<th className="px-4 py-2.5 text-[11px] font-semibold text-[#475569] uppercase tracking-[0.04em] whitespace-nowrap">
													Kondisi
												</th>
												<th className="px-4 py-2.5 text-[11px] font-semibold text-[#475569] uppercase tracking-[0.04em] text-right whitespace-nowrap">
													Aksi
												</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#E6E8EA]">
											{groups.antrean.map((eq) => {
												const plantCode = formatPlantDisplay(
													eq.plant,
													eq.storage_location,
													eq.plant_description,
												);
												const condition = formatCondition(eq.condition);

												return (
													<tr
														key={eq.id}
														className="hover:bg-[#F2F3F4]/50 transition-colors"
													>
														<td className="px-4 py-2.5 font-mono text-[12px] font-semibold text-[#0A356A] whitespace-nowrap">
															{eq.equipment_code || "-"}
														</td>
														<td className="px-4 py-2.5 text-[13px] text-[#0F172A] max-w-[240px]">
															<span className="font-medium block truncate">
																{eq.name || "Equipment Tanpa Nama"}
															</span>
															{eq.notes && eq.notes !== "-" && (
																<span className="text-[11px] text-[#64748B] block truncate mt-0.5">
																	{eq.notes}
																</span>
															)}
														</td>
														<td className="px-4 py-2.5 font-mono text-[12px] text-[#334155] whitespace-nowrap">
															{plantCode}
														</td>
														<td className="px-4 py-2.5 whitespace-nowrap">
															<span className="inline-flex items-center rounded-[2px] px-2 py-0.5 text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
																{condition}
															</span>
														</td>
														<td className="px-4 py-2.5 text-right whitespace-nowrap">
															<Link
																href="/pemeliharaan/perbaikan-alat"
																className="inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-[#0A356A] hover:bg-[#0556B3] px-3 py-1 rounded-[4px] transition-colors"
															>
																<span>Kerjakan</span>
																<ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
															</Link>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>

					<div className="px-5 py-3 border-t border-[#E6E8EA] bg-[#F8FAFC] flex items-center justify-between">
						<span className="text-[12px] text-[#64748B] tabular-nums">
							{groups.antrean.length} peralatan dalam antrean perbaikan
						</span>
						<Link
							href="/pemeliharaan/perbaikan-alat"
							className="text-[12px] font-semibold text-[#0A356A] hover:text-[#0556B3] inline-flex items-center gap-1 transition-colors"
						>
							<span>Buka Manajemen Perbaikan</span>
							<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
						</Link>
					</div>
				</div>

				<div className="bg-white border border-[#E6E8EA] rounded-[4px] flex flex-col justify-between">
					<div>
						<div className="px-5 py-4 border-b border-[#E6E8EA]">
							<h2 className="text-[14px] font-semibold text-[#0F172A]">
								Perubahan Terakhir
							</h2>
							<p className="text-[12px] text-[#64748B] mt-0.5">
								Aset yang statusnya paling baru berubah.
							</p>
						</div>
						{recentActivity.length === 0 ? (
							<p className="px-5 py-8 text-[13px] text-[#64748B]">
								Belum ada perubahan status.
							</p>
						) : (
							<ul className="divide-y divide-[#E6E8EA]">
								{recentActivity.map((eq) => {
									const status = repairFlowStatus(eq) ?? "REPAIR";
									return (
										<li
											key={eq.id}
											className="relative flex items-start gap-3.5 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors duration-150"
										>
											<span
												className="w-1 self-stretch rounded-full shrink-0 my-0.5"
												style={{ backgroundColor: STATUS_COLOR[status] }}
												aria-hidden="true"
											/>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="font-mono text-[13px] font-semibold text-[#0F172A]">
														{eq.equipment_code || "-"}
													</span>
													{eq.name && (
														<span className="text-[13px] text-[#475569] truncate">
															{str(eq.name)}
														</span>
													)}
												</div>
												<div className="flex items-center gap-2 mt-1.5 flex-wrap">
													<span
														className="inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] font-semibold"
														style={{ color: STATUS_COLOR[status] }}
													>
														<span
															className="w-1.5 h-1.5 rounded-full shrink-0"
															style={{ backgroundColor: STATUS_COLOR[status] }}
															aria-hidden="true"
														/>
														{REPAIR_STATUS_LABEL[status]}
													</span>
													<span className="text-[#CBD5E1]">·</span>
													<span className="text-[13px] font-medium text-[#64748B]">
														{relativeTime(eq.updated_at || eq.created_at)}
													</span>
												</div>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>
					<Link
						href="/pemeliharaan/perbaikan-alat"
						className="flex items-center justify-between px-5 py-3.5 border-t border-[#E6E8EA] text-[13px] font-medium text-[#0A356A] hover:bg-[#F2F3F4] transition-colors duration-[140ms] ease-out"
					>
						Buka daftar perbaikan
						<ChevronRight className="w-4 h-4" aria-hidden="true" />
					</Link>
				</div>
			</div>
		</div>
	);
}
