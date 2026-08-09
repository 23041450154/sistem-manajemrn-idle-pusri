"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getEquipments } from "@/action/api";
import {
	LayoutDashboard,
	Wrench,
	CheckCircle2,
	Clock,
	AlertTriangle,
	Loader2,
	RefreshCw,
	ChevronRight,
	Activity,
	TrendingUp,
	BarChart3,
} from "lucide-react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Equipment {
	id: number;
	name: string;
	equipment_code: string;
	status?: { id: number; name: string };
	status_id?: number;
	condition?: { id: number; name: string };
	plant?: { id: number; name: string } | string;
	plant_description?: string;
	storage_location?: { id: number; name: string } | string;
	updated_at?: string;
	created_at?: string;
	actual_cost?: number;
	original_value?: number;
	estimated_reuse_value?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function str(val: unknown): string {
	if (val == null) return "-";
	if (typeof val === "string") return val;
	if (typeof val === "object" && val !== null) {
		const obj = val as Record<string, unknown>;
		if (typeof obj.name === "string") return obj.name;
	}
	return String(val);
}

function statusName(eq: Equipment): string {
	return (eq.status?.name || "").toUpperCase();
}

function relativeTime(dateStr?: string): string {
	if (!dateStr) return "-";
	const now = new Date();
	const d = new Date(dateStr);
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	if (diffDays === 0) return "Hari ini";
	if (diffDays === 1) return "Kemarin";
	if (diffDays < 7) return `${diffDays} hari lalu`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
	return `${Math.floor(diffDays / 30)} bulan lalu`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PemeliharaanDashboardPage() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const loadData = async () => {
		setIsLoading(true);
		try {
			const data = await getEquipments();
			setEquipments(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error("Failed to load equipments:", err);
			setEquipments([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	/* ---- Computed stats ---- */

	const stats = useMemo(() => {
		const maintenance = equipments.filter(
			(e) =>
				e.status_id === 6 ||
				e.status?.id === 6 ||
				statusName(e) === "MAINTENANCE" ||
				statusName(e) === "DALAM_PERBAIKAN",
		);

		const readyToReuse = equipments.filter(
			(e) =>
				statusName(e) === "READY_TO_REUSE" ||
				e.status_id === 5 ||
				e.status?.id === 5,
		);

		const repair = equipments.filter(
			(e) => statusName(e) === "REPAIR" || statusName(e) === "REJECTED",
		);

		const totalCost = maintenance.reduce(
			(sum, e) => sum + (Number(e.actual_cost) || 0),
			0,
		);

		return { maintenance, readyToReuse, repair, totalCost };
	}, [equipments]);

	/* ---- Donut chart data ---- */

	const donutData = useMemo(() => {
		const items = [
			{
				name: "Dalam Perbaikan",
				value: stats.maintenance.length,
				color: "#F59E0B",
			},
			{
				name: "Selesai (Ready)",
				value: stats.readyToReuse.length,
				color: "#10B981",
			},
			{
				name: "Perlu Perhatian",
				value: stats.repair.length,
				color: "#EF4444",
			},
		].filter((d) => d.value > 0);
		return items.length > 0
			? items
			: [{ name: "Belum ada data", value: 1, color: "#CBD5E1" }];
	}, [stats]);

	/* ---- Bar chart: maintenance per plant ---- */

	const plantBarData = useMemo(() => {
		const map = new Map<string, { plant: string; count: number }>();
		stats.maintenance.forEach((eq) => {
			const plant = str(eq.plant) || str(eq.plant_description) || "Lainnya";
			const entry = map.get(plant) || { plant, count: 0 };
			entry.count += 1;
			map.set(plant, entry);
		});
		return Array.from(map.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 6);
	}, [stats.maintenance]);

	/* ---- Recent activity ---- */

	const recentActivity = useMemo(() => {
		return [...stats.maintenance, ...stats.readyToReuse]
			.sort(
				(a, b) =>
					new Date(b.updated_at || b.created_at || 0).getTime() -
					new Date(a.updated_at || a.created_at || 0).getTime(),
			)
			.slice(0, 5);
	}, [stats.maintenance, stats.readyToReuse]);

	/* ---- Render ---- */

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-[60vh]">
				<Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
				<p className="text-sm font-semibold text-slate-500">
					Memuat data dashboard...
				</p>
			</div>
		);
	}

	const kpiCards = [
		{
			label: "Dalam Perbaikan",
			value: stats.maintenance.length,
			icon: Wrench,
			color: "#F59E0B",
			bgColor: "bg-amber-50",
			textColor: "text-amber-700",
			borderColor: "border-amber-300",
		},
		{
			label: "Selesai Diperbaiki",
			value: stats.readyToReuse.length,
			icon: CheckCircle2,
			color: "#10B981",
			bgColor: "bg-emerald-50",
			textColor: "text-emerald-700",
			borderColor: "border-emerald-300",
		},
		{
			label: "Perlu Perhatian",
			value: stats.repair.length,
			icon: AlertTriangle,
			color: "#EF4444",
			bgColor: "bg-red-50",
			textColor: "text-red-700",
			borderColor: "border-red-300",
		},
		{
			label: "Total Biaya Perbaikan",
			value: `Rp ${new Intl.NumberFormat("id-ID").format(stats.totalCost)}`,
			icon: TrendingUp,
			color: "#0A356A",
			bgColor: "bg-blue-50",
			textColor: "text-[#0A356A]",
			borderColor: "border-blue-300",
			isText: true,
		},
	];

	return (
		<div className="max-w-7xl mx-auto pt-2 pb-8 flex flex-col gap-6">
			{/* ===== Header ===== */}
			<div className="border-b border-gray-200 pb-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-bold text-[#0A356A] tracking-tight flex items-center gap-2.5">
							<LayoutDashboard className="w-6 h-6" />
							Dashboard Pemeliharaan
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Ringkasan status perbaikan dan pemeliharaan peralatan.
						</p>
					</div>
					<button
						onClick={loadData}
						className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#0A356A] transition-colors shadow-sm"
					>
						<RefreshCw className="w-4 h-4" />
						Refresh Data
					</button>
				</div>
			</div>

			{/* ===== KPI Cards ===== */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{kpiCards.map((card) => (
					<div
						key={card.label}
						className={`bg-white rounded border border-[#E6E8EA] p-4 flex flex-col gap-3 relative overflow-hidden border-l-2 ${card.borderColor}`}
					>
						<div className="flex items-center justify-between">
							<span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
								{card.label}
							</span>
							<div
								className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center`}
							>
								<card.icon className="w-4 h-4" style={{ color: card.color }} />
							</div>
						</div>
						<div>
							<span
								className={`${card.isText ? "text-lg" : "text-2xl"} font-bold ${card.textColor}`}
							>
								{card.value}
							</span>
							{!card.isText && (
								<span className="text-xs text-gray-400 ml-1 font-medium">
									unit
								</span>
							)}
						</div>
					</div>
				))}
			</div>

			{/* ===== Charts Row ===== */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Donut Chart */}
				<div className="bg-white rounded border border-[#E6E8EA] p-5">
					<div className="flex items-center gap-2 mb-4">
						<Activity className="w-4 h-4 text-[#0A356A]" />
						<h3 className="text-sm font-bold text-gray-800">
							Distribusi Status Pemeliharaan
						</h3>
					</div>

					<div className="flex items-center justify-center">
						<div className="relative w-full max-w-[250px]">
							<ResponsiveContainer width="100%" height={220}>
								<PieChart>
									<Pie
										data={donutData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={90}
										paddingAngle={3}
										dataKey="value"
										stroke="none"
									>
										{donutData.map((entry, idx) => (
											<Cell key={idx} fill={entry.color} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											fontSize: "12px",
											borderRadius: "8px",
											border: "1px solid #E6E8EA",
										}}
									/>
								</PieChart>
							</ResponsiveContainer>

							{/* Center label */}
							<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
								<span className="text-2xl font-bold text-gray-800">
									{stats.maintenance.length +
										stats.readyToReuse.length +
										stats.repair.length}
								</span>
								<span className="text-[10px] text-gray-400 font-medium">
									Total Unit
								</span>
							</div>
						</div>

						{/* Legend */}
						<div className="flex flex-col gap-2.5 ml-4">
							{donutData.map((d, i) => (
								<div key={i} className="flex items-center gap-2">
									<div
										className="w-2.5 h-2.5 rounded-full shrink-0"
										style={{ backgroundColor: d.color }}
									/>
									<div>
										<p className="text-xs font-medium text-gray-700">
											{d.name}
										</p>
										<p className="text-[10px] text-gray-400">{d.value} unit</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Bar Chart - per Plant */}
				<div className="bg-white rounded border border-[#E6E8EA] p-5">
					<div className="flex items-center gap-2 mb-4">
						<BarChart3 className="w-4 h-4 text-[#0A356A]" />
						<h3 className="text-sm font-bold text-gray-800">
							Perbaikan per Plant
						</h3>
					</div>

					{plantBarData.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-[200px] text-center">
							<p className="text-xs text-gray-400 font-medium">
								Belum ada data perbaikan per plant.
							</p>
						</div>
					) : (
						<ResponsiveContainer width="100%" height={220}>
							<BarChart
								data={plantBarData}
								margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
							>
								<CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
								<XAxis
									dataKey="plant"
									tick={{ fontSize: 10, fill: "#94A3B8" }}
									tickLine={false}
									axisLine={{ stroke: "#E2E8F0" }}
								/>
								<YAxis
									tick={{ fontSize: 10, fill: "#94A3B8" }}
									tickLine={false}
									axisLine={false}
									allowDecimals={false}
								/>
								<Tooltip
									contentStyle={{
										fontSize: "12px",
										borderRadius: "8px",
										border: "1px solid #E6E8EA",
									}}
								/>
								<Bar
									dataKey="count"
									name="Jumlah"
									fill="#0A356A"
									radius={[4, 4, 0, 0]}
									maxBarSize={40}
								/>
							</BarChart>
						</ResponsiveContainer>
					)}
				</div>
			</div>

			{/* ===== Bottom Row: Actions + Activity ===== */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Perlu Tindakan */}
				<div className="bg-white rounded border border-[#E6E8EA] p-5">
					<div className="flex items-center gap-2 mb-4">
						<AlertTriangle className="w-4 h-4 text-amber-500" />
						<h3 className="text-sm font-bold text-gray-800">
							Perlu Tindakan
						</h3>
					</div>

					<div className="space-y-2.5">
						{stats.maintenance.length > 0 && (
							<div className="flex items-start gap-3 p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
								<Wrench className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
								<div>
									<p className="text-xs font-semibold text-gray-800">
										{stats.maintenance.length} aset sedang dalam proses
										perbaikan
									</p>
									<p className="text-[10px] text-gray-500 mt-0.5">
										Pastikan semua proses perbaikan diselesaikan tepat waktu.
									</p>
								</div>
							</div>
						)}

						{stats.repair.length > 0 && (
							<div className="flex items-start gap-3 p-3 bg-red-50/60 border border-red-100 rounded-lg">
								<AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
								<div>
									<p className="text-xs font-semibold text-gray-800">
										{stats.repair.length} aset memerlukan perhatian khusus
									</p>
									<p className="text-[10px] text-gray-500 mt-0.5">
										Aset dalam status ditolak / perlu perbaikan ulang.
									</p>
								</div>
							</div>
						)}

						{stats.maintenance.length === 0 && stats.repair.length === 0 && (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
								<p className="text-xs font-semibold text-gray-600">
									Tidak ada tindakan mendesak
								</p>
								<p className="text-[10px] text-gray-400 mt-0.5">
									Semua aset dalam kondisi baik.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Aktivitas Terbaru */}
				<div className="bg-white rounded border border-[#E6E8EA] p-5">
					<div className="flex items-center gap-2 mb-4">
						<Clock className="w-4 h-4 text-[#0A356A]" />
						<h3 className="text-sm font-bold text-gray-800">
							Aktivitas Terbaru
						</h3>
					</div>

					{recentActivity.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<p className="text-xs text-gray-400 font-medium">
								Belum ada aktivitas.
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{recentActivity.map((eq) => {
								const st = statusName(eq);
								const isMaintenance =
									st === "MAINTENANCE" || st === "DALAM_PERBAIKAN";
								return (
									<div
										key={eq.id}
										className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
									>
										<div
											className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
												isMaintenance
													? "bg-amber-50 text-amber-600"
													: "bg-emerald-50 text-emerald-600"
											}`}
										>
											{isMaintenance ? (
												<Wrench className="w-3.5 h-3.5" />
											) : (
												<CheckCircle2 className="w-3.5 h-3.5" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-semibold text-gray-800 truncate">
												{eq.equipment_code || "-"} — {str(eq.name)}
											</p>
											<p className="text-[10px] text-gray-400 mt-0.5">
												{isMaintenance
													? "Dalam perbaikan"
													: "Selesai diperbaiki"}{" "}
												· {str(eq.plant)}
											</p>
										</div>
										<span className="text-[10px] text-gray-400 font-medium shrink-0">
											{relativeTime(eq.updated_at || eq.created_at)}
										</span>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
