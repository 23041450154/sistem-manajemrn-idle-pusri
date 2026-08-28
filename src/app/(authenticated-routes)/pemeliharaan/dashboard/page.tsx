"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getEquipments, getEquipmentRepairs } from "@/action/api";
import {
	Loader2,
	RefreshCw,
	ArrowRight,
	ChevronRight,
	Check,
} from "lucide-react";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
} from "recharts";
import {
	repairFlowStatus,
	REPAIR_STATUS_LABEL,
	rupiah,
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
	updated_at?: string;
	created_at?: string;
}

interface Repair {
	id: number;
	equipment_id?: number;
	actual_cost?: number;
	start_at?: string;
	end_at?: string;
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

/** DESIGN.md KPI card: 2px left rule in state hue, value-dominant, no icon tile, no gradient. */
function KpiCard({
	label,
	value,
	caption,
	rule,
}: {
	label: string;
	value: string;
	caption: string;
	rule: string;
}) {
	return (
		<div
			className="bg-white border border-[#E6E8EA] rounded-[4px] p-5 border-l-2"
			style={{ borderLeftColor: rule }}
		>
			<p className="text-[12px] font-medium text-[#64748B]">{label}</p>
			<p className="text-[28px] font-semibold text-[#0F172A] tracking-[-0.02em] tabular-nums leading-tight mt-1">
				{value}
			</p>
			<p className="text-[12px] text-[#64748B] mt-1">{caption}</p>
		</div>
	);
}

export default function PemeliharaanDashboardPage() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [repairs, setRepairs] = useState<Repair[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const [eq, rp] = await Promise.all([getEquipments(), getEquipmentRepairs()]);
			setEquipments(Array.isArray(eq) ? eq : []);
			setRepairs(Array.isArray(rp) ? rp : []);
		} catch (err) {
			console.error("Failed to load dashboard data:", err);
			setEquipments([]);
			setRepairs([]);
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

	// Biaya nyata dari tabel repair — equipment tidak punya kolom actual_cost.
	const costSummary = useMemo(() => {
		const total = repairs.reduce(
			(sum, r) => sum + (Number(r.actual_cost) || 0),
			0,
		);
		return {
			total,
			count: repairs.length,
			avg: repairs.length ? total / repairs.length : 0,
		};
	}, [repairs]);

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

	const plantBarData = useMemo(() => {
		const map = new Map<string, number>();
		for (const eq of groups.antrean) {
			const plant =
				str(eq.plant) !== "-" ? str(eq.plant) : str(eq.plant_description);
			map.set(plant, (map.get(plant) ?? 0) + 1);
		}
		return [...map.entries()]
			.map(([plant, count]) => ({ plant, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 6);
	}, [groups.antrean]);

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

			{/* KPI strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<KpiCard
					label="Antrean perbaikan"
					value={String(groups.antrean.length)}
					caption="Milik Pemeliharaan, belum dikerjakan"
					rule={STATUS_COLOR.REPAIR}
				/>
				<KpiCard
					label="Menunggu validasi ulang"
					value={String(groups.menungguValidasi.length)}
					caption="Sudah diperbaiki, di Inspeksi Teknik"
					rule={STATUS_COLOR.REPAIR_COMPLETED}
				/>
				<KpiCard
					label="Siap digunakan"
					value={String(groups.selesai.length)}
					caption="Lolos validasi dan persetujuan Rendal"
					rule={STATUS_COLOR.READY_TO_USE}
				/>
				<KpiCard
					label="Biaya perbaikan tercatat"
					value={rupiah(costSummary.total)}
					caption={`${costSummary.count} pekerjaan, rata-rata ${rupiah(costSummary.avg)}`}
					rule="#475569"
				/>
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
									Antrean Perbaikan per Plant
								</h2>
								<p className="text-[12px] text-[#64748B] mt-0.5">
									Enam plant dengan antrean terbanyak. Menentukan ke mana tim dikirim lebih
									dulu.
								</p>
							</div>
							<span className="text-[12px] font-semibold text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-1 rounded-[4px] shrink-0">
								{groups.antrean.length} Aset Total
							</span>
						</div>
						<div className="p-5">
							{plantBarData.length === 0 ? (
								<div className="flex items-center gap-2 py-12 justify-center text-[13px] text-[#475569]">
									<Check className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
									Antrean kosong. Tidak ada aset berstatus REPAIR.
								</div>
							) : (
								<>
									<div className="w-full h-[220px]">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart
												data={plantBarData}
												margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
											>
												<CartesianGrid
													strokeDasharray="3 3"
													stroke="#E6E8EA"
													vertical={false}
												/>
												<XAxis
													dataKey="plant"
													tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
													tickLine={false}
													axisLine={{ stroke: "#E6E8EA" }}
												/>
												<YAxis
													tick={{ fontSize: 12, fill: "#64748B" }}
													tickLine={false}
													axisLine={false}
													allowDecimals={false}
													width={32}
												/>
												<Tooltip
													contentStyle={{
														fontSize: "12px",
														borderRadius: "4px",
														border: "1px solid #E6E8EA",
														boxShadow: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
													}}
													formatter={(value) => [`${value} aset`, "Antrean"]}
												/>
												<Bar
													dataKey="count"
													name="Antrean"
													fill={STATUS_COLOR.REPAIR}
													radius={[4, 4, 0, 0]}
													maxBarSize={36}
												/>
											</BarChart>
										</ResponsiveContainer>
									</div>

									{/* Quick breakdown grid of top plants */}
									<div className="mt-4 pt-4 border-t border-[#E6E8EA] grid grid-cols-2 sm:grid-cols-3 gap-2.5">
										{plantBarData.map((item) => (
											<div
												key={item.plant}
												className="flex items-center justify-between bg-[#F8FAFC] border border-[#E6E8EA] rounded-[4px] px-3.5 py-2"
											>
												<span className="text-[13px] font-medium text-[#334155] truncate">
													{item.plant}
												</span>
												<span className="text-[13px] font-semibold text-[#0F172A] tabular-nums ml-2 shrink-0">
													{item.count}{" "}
													<span className="text-[11px] font-normal text-[#64748B]">
														aset
													</span>
												</span>
											</div>
										))}
									</div>
								</>
							)}
						</div>
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
