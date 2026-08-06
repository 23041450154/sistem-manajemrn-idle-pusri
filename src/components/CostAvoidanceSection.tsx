"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";
import {
	Recycle,
	ChevronDown,
	Clock,
	Wrench,
	CheckCircle,
	AlertCircle,
	Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getEquipments, getDisposals } from "@/action/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Equipment = any;

const formatCurrency = (value: number) => {
	if (value >= 1_000_000_000) {
		return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
	}
	if (value >= 1_000_000) {
		return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
	}
	if (value >= 1_000) {
		return `Rp ${(value / 1_000).toFixed(0)} Rb`;
	}
	return `Rp ${value.toLocaleString("id-ID")}`;
};

const monthNames = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"Mei",
	"Jun",
	"Jul",
	"Agu",
	"Sep",
	"Okt",
	"Nov",
	"Des",
];

export function CostAvoidanceSection() {
	const [equipments, setEquipments] = useState<Equipment[]>([]);
	const [disposals, setDisposals] = useState<Equipment[]>([]);
	// Clock snapshot taken when data lands, so relative timestamps ("2 hari yang
	// lalu") stay stable across re-renders instead of being read during render.
	const [loadedAt, setLoadedAt] = useState<number | null>(null);

	useEffect(() => {
		async function fetchData() {
			try {
				const [eq, disp] = await Promise.all([getEquipments(), getDisposals()]);
				setEquipments(eq || []);
				setDisposals(disp || []);
				setLoadedAt(Date.now());
			} catch (error) {
				console.error("CostAvoidance fetch error:", error);
			}
		}
		fetchData();
	}, []);

	// --- Dynamic Operational Counts ---
	// Menunggu Validasi (REGISTERED or VALIDATED)
	const menungguValidasiCount = equipments.filter(
		(e: Equipment) =>
			e.status?.name === "REGISTERED" ||
			e.status?.name === "VALIDATED" ||
			e.statusAset === "REGISTERED" ||
			e.statusAset === "VALIDATED",
	).length;

	// Dalam Perbaikan (REJECTED or DALAM_PERBAIKAN or REPAIR)
	const dalamPerbaikanCount = equipments.filter(
		(e: Equipment) =>
			e.status?.name === "REJECTED" ||
			e.status?.name === "DALAM_PERBAIKAN" ||
			e.status?.name === "REPAIR" ||
			e.statusAset === "REJECTED",
	).length;

	// Ready to Reuse (READY_TO_REUSE or IDLE)
	const readyCount = equipments.filter(
		(e: Equipment) =>
			e.status?.name === "READY_TO_REUSE" ||
			e.status?.name === "IDLE" ||
			e.statusAset === "READY_TO_REUSE" ||
			e.statusAset === "IDLE",
	).length;

	// Menunggu Disposal
	const disposalCount = disposals.filter(
		(d: Equipment) => d.status !== "DISPOSED",
	).length;

	// --- Dynamic Recent Activities ---
	const sortedEquipments = [...equipments].sort(
		(a: Equipment, b: Equipment) => {
			const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
			const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
			return dateB - dateA;
		},
	);

	const recentActivities = sortedEquipments.slice(0, 4).map((e: Equipment) => {
		const name = e.name || e.namaAlat || e.nama_alat || "Peralatan";
		const tag = e.equipment_code || e.kodeAlat || e.kode_alat || "";
		const status = e.status?.name || e.statusAset || "REGISTERED";

		let text = "";
		if (status === "REGISTERED") {
			text = `Peralatan ${name} (${tag}) baru diregistrasi oleh Rendal`;
		} else if (status === "VALIDATED") {
			text = `Inspeksi selesai: ${name} (${tag}) tervalidasi & menunggu approval`;
		} else if (status === "READY_TO_REUSE") {
			text = `Peralatan ${name} (${tag}) siap digunakan kembali (Ready to Reuse)`;
		} else if (status === "REJECTED") {
			text = `Peralatan ${name} (${tag}) selesai diinspeksi dengan status ditolak/revisi`;
		} else if (status === "IDLE") {
			text = `Aset ${name} (${tag}) disetujui manajer menjadi status IDLE`;
		} else {
			text = `Status peralatan ${name} (${tag}) diperbarui menjadi ${status.replace(/_/g, " ")}`;
		}

		// Snapshot captured on data load, never read during render.
		const timestamp = e.updated_at || e.created_at;
		let timeStr = "Baru saja";
		if (timestamp && loadedAt !== null) {
			const diffDays = Math.floor(
				(loadedAt - new Date(timestamp).getTime()) / (1000 * 3600 * 24),
			);
			if (diffDays === 0) {
				timeStr = "Hari ini";
			} else if (diffDays === 1) {
				timeStr = "Kemarin";
			} else if (diffDays > 1) {
				timeStr = `${diffDays} hari yang lalu`;
			}
		}

		return { text, time: timeStr };
	});

	// --- Donut Chart: Breakdown by Status (Counts) ---
	const pieData = [
		{
			name: "Menunggu Validasi",
			value: menungguValidasiCount,
			color: "#f59e0b",
		},
		{ name: "Dalam Perbaikan", value: dalamPerbaikanCount, color: "#ef4444" },
		{ name: "Siap Re-use / Idle", value: readyCount, color: "#10b981" },
		{ name: "Disposal", value: disposalCount, color: "#8b5cf6" },
	].filter((item) => item.value > 0);

	if (pieData.length === 0) {
		pieData.push({ name: "Tidak Ada Data", value: 1, color: "#e5e7eb" });
	}

	// --- Financial Calculations for Bottom Charts ---
	const idleEquipments = equipments.filter(
		(e: Equipment) => e.status?.name === "IDLE",
	);
	const readyEquipments = equipments.filter(
		(e: Equipment) => e.status?.name === "READY_TO_REUSE",
	);

	const potentialSavings = idleEquipments.reduce(
		(sum: number, e: Equipment) =>
			sum + (Number(e.original_value) || Number(e.estimated_reuse_value) || 0),
		0,
	);

	const realizedSavings = readyEquipments.reduce(
		(sum: number, e: Equipment) =>
			sum + (Number(e.original_value) || Number(e.estimated_reuse_value) || 0),
		0,
	);

	const disposalRecovery = disposals
		.filter((d: Equipment) => d.status === "DISPOSED")
		.reduce(
			(sum: number, d: Equipment) => sum + (Number(d.scrap_value) || 0),
			0,
		);

	// --- Bar Chart: Cost Avoidance by Plant ---
	const plantMap = new Map<
		string,
		{ plant: string; potential: number; realized: number }
	>();
	equipments.forEach((e: Equipment) => {
		const plant = e.plant_description || e.plant || "Tidak Diketahui";
		const reuseValue =
			Number(e.original_value) || Number(e.estimated_reuse_value) || 0;
		if (!plantMap.has(plant)) {
			plantMap.set(plant, { plant, potential: 0, realized: 0 });
		}
		const entry = plantMap.get(plant)!;
		if (e.status?.name === "IDLE") entry.potential += reuseValue;
		if (e.status?.name === "READY_TO_REUSE") entry.realized += reuseValue;
	});
	const plantData = Array.from(plantMap.values())
		.sort((a, b) => b.potential + b.realized - a.potential - a.realized)
		.slice(0, 5); // top 5 plants to keep it compact

	// --- Area Chart: Monthly Trend ---
	const monthlyMap = new Map<
		string,
		{ month: string; value: number; cumulative: number }
	>();
	let cumulativeTotal = 0;
	const now = new Date();
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		monthlyMap.set(key, {
			month: monthNames[d.getMonth()],
			value: 0,
			cumulative: 0,
		});
	}

	equipments.forEach((e: Equipment) => {
		if (!e.created_at) return;
		const d = new Date(e.created_at);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		if (monthlyMap.has(key)) {
			const entry = monthlyMap.get(key)!;
			entry.value +=
				Number(e.original_value) || Number(e.estimated_reuse_value) || 0;
		}
	});

	const monthlyData = Array.from(monthlyMap.values());
	monthlyData.forEach((entry) => {
		cumulativeTotal += entry.value;
		entry.cumulative = cumulativeTotal;
	});

	// DESIGN.md KPI card: one style, value-dominant, state carried by a 2px left rule.
	// Data-driven so the four cards cannot drift apart (they previously differed only by hue).
	const kpis = [
		{
			label: "Menunggu Validasi",
			value: menungguValidasiCount,
			caption: "Aset baru diajukan",
			rule: "#0556B3",
			icon: Clock,
		},
		{
			label: "Dalam Perbaikan",
			value: dalamPerbaikanCount,
			caption: "Aset butuh pemeliharaan",
			rule: "#B45309",
			icon: Wrench,
		},
		{
			label: "Ready to Reuse",
			value: readyCount,
			caption: "Siap digunakan kembali",
			rule: "#059669",
			icon: CheckCircle,
		},
		{
			label: "Menunggu Disposal",
			value: disposalCount,
			caption: "Proses penghapusan aset",
			rule: "#475569",
			icon: Recycle,
		},
	];

	return (
		<div className="flex flex-col gap-6">
			{/* 1. Operational KPI strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{kpis.map((kpi) => (
					<div
						key={kpi.label}
						className="bg-white rounded border border-[#E6E8EA] border-l-2 p-4 flex items-start justify-between gap-3"
						style={{ borderLeftColor: kpi.rule }}
					>
						<div className="min-w-0">
							<p className="text-[12px] font-medium text-[#64748B] truncate">
								{kpi.label}
							</p>
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

			{/* 2. Middle Row: Action Items & Recent Activities (Left) vs Asset Status (Right) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Action Items & Recent Feed */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					{/* Perlu Tindakan */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5">
						<h3 className="text-[14px] font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
							<AlertCircle
								className="w-4 h-4 text-[#B45309]"
								aria-hidden="true"
							/>
							Perlu Tindakan Hari Ini
						</h3>
						<div className="divide-y divide-[#E6E8EA] border-t border-[#E6E8EA]">
							{menungguValidasiCount > 0 && (
								<div className="flex items-start gap-2.5 text-[13px] text-[#475569] py-2.5">
									<span
										className="w-0.5 self-stretch shrink-0 bg-[#0556B3]"
										aria-hidden="true"
									/>
									<div>
										<span className="font-semibold text-[#0F172A]">
											{menungguValidasiCount} aset belum diverifikasi
										</span>
										. Lakukan inspeksi teknis untuk kelayakan idle.
									</div>
								</div>
							)}
							{dalamPerbaikanCount > 0 && (
								<div className="flex items-start gap-2.5 text-[13px] text-[#475569] py-2.5">
									<span
										className="w-0.5 self-stretch shrink-0 bg-[#B45309]"
										aria-hidden="true"
									/>
									<div>
										<span className="font-semibold text-[#0F172A]">
											{dalamPerbaikanCount} pemeliharaan aktif
										</span>
										. Pantau servis peralatan agar siap direuse.
									</div>
								</div>
							)}
							{disposalCount > 0 && (
								<div className="flex items-start gap-2.5 text-[13px] text-[#475569] py-2.5">
									<span
										className="w-0.5 self-stretch shrink-0 bg-[#475569]"
										aria-hidden="true"
									/>
									<div>
										<span className="font-semibold text-[#0F172A]">
											{disposalCount} disposal menunggu approval
										</span>
										. Tindak lanjuti usulan pelelangan.
									</div>
								</div>
							)}
							{menungguValidasiCount === 0 &&
								dalamPerbaikanCount === 0 &&
								disposalCount === 0 && (
									<div className="flex items-center gap-2 text-[13px] text-[#475569] py-3">
										<Check
											className="w-4 h-4 text-[#059669] shrink-0"
											aria-hidden="true"
										/>
										<span>Tidak ada tindakan tertunda hari ini.</span>
									</div>
								)}
						</div>
					</div>

					{/* Aktivitas Terbaru */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5">
						<h3 className="text-[14px] font-semibold text-[#0F172A] mb-3">
							Aktivitas Terbaru
						</h3>
						<div className="divide-y divide-[#E6E8EA] border-t border-[#E6E8EA]">
							{recentActivities.length > 0 ? (
								recentActivities.map((act, index) => (
									<div
										key={index}
										className="py-2.5 flex items-start gap-3 first:pt-0 last:pb-0"
									>
										<div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
											✓
										</div>
										<div className="flex-1">
											<p className="text-[13px] text-gray-700 font-medium">
												{act.text}
											</p>
											<span className="text-[10px] text-gray-400 font-medium block mt-0.5">
												{act.time}
											</span>
										</div>
									</div>
								))
							) : (
								<div className="py-4 text-center text-sm text-gray-400 font-medium">
									Belum ada aktivitas perekaman atau pembaruan aset saat ini.
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Right Column: Donut Status Aset (Jumlah Unit) */}
				<div className="bg-white rounded border border-[#E6E8EA] p-5 flex flex-col justify-between">
					<div>
						<h3 className="text-sm font-bold text-gray-800">Status Aset</h3>
						<p className="text-[11px] text-gray-500 mt-0.5">
							Distribusi aset berdasarkan kondisi operasional saat ini
						</p>
					</div>

					<div className="relative h-40 flex justify-center items-center mt-3">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData}
									cx="50%"
									cy="50%"
									innerRadius={48}
									outerRadius={68}
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
										borderRadius: "8px",
										border: "none",
										boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
									}}
									formatter={(value) => `${value} Unit`}
								/>
							</PieChart>
						</ResponsiveContainer>
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
							<span className="text-2xl font-extrabold text-gray-800">
								{equipments.length}
							</span>
							<span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
								Total Unit
							</span>
						</div>
					</div>

					<div className="mt-4 space-y-2">
						{pieData.map((item) => (
							<div
								key={item.name}
								className="flex justify-between items-center text-[12px]"
							>
								<div className="flex items-center gap-2">
									<span
										className="w-2.5 h-2.5 rounded-full"
										style={{ backgroundColor: item.color }}
									></span>
									<span className="text-gray-600 font-semibold">
										{item.name}
									</span>
								</div>
								<span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-[#E6E8EA] text-xs">
									{item.value} Unit (
									{Math.round((item.value / (equipments.length || 1)) * 100)}%)
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			<hr className="border-[#E6E8EA]/60 my-2" />

			{/* 3. Executive Analytic Charts at the Bottom (Smaller & Side by Side) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Plant Savings Chart */}
				<div className="bg-white rounded border border-[#E6E8EA] p-5">
					<div className="flex justify-between items-center mb-4">
						<div>
							<h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
								Penghematan Biaya per Plant
							</h3>
							<p className="text-[10px] text-gray-400 mt-0.5">
								Nilai optimalisasi aset per lokasi pabrik
							</p>
						</div>
						<button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors">
							Semua Plant
							<ChevronDown className="w-2.5 h-2.5" />
						</button>
					</div>
					<div className="h-56">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={
									plantData.length > 0
										? plantData
										: [{ plant: "No Data", potential: 0, realized: 0 }]
								}
								margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#e5e7eb"
								/>
								<XAxis
									dataKey="plant"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 9, fill: "#6b7280" }}
									dy={5}
									interval={0}
									angle={-10}
									textAnchor="end"
									height={40}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 9, fill: "#6b7280" }}
									tickFormatter={(v) => formatCurrency(v)}
									width={60}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: "8px",
										border: "none",
										boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
									}}
									formatter={(value) => formatCurrency(Number(value) || 0)}
								/>
								<Legend
									wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }}
									iconType="circle"
									iconSize={6}
								/>
								<Bar
									dataKey="realized"
									name="Terealisasi"
									fill="#10b981"
									radius={[4, 4, 0, 0]}
									maxBarSize={25}
								/>
								<Bar
									dataKey="potential"
									name="Potensi"
									fill="#2563eb"
									radius={[4, 4, 0, 0]}
									maxBarSize={25}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Monthly Trend Chart */}
				<div className="bg-white rounded border border-[#E6E8EA] p-5">
					<div className="flex justify-between items-center mb-4">
						<div>
							<h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
								Tren Penghematan Biaya Bulanan
							</h3>
							<p className="text-[10px] text-gray-400 mt-0.5">
								Akumulasi nilai optimalisasi aset 6 bulan terakhir
							</p>
						</div>
						<button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors">
							6 Bulan Terakhir
							<ChevronDown className="w-2.5 h-2.5" />
						</button>
					</div>
					<div className="h-56">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={monthlyData}
								margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
							>
								<defs>
									<linearGradient
										id="colorCumulative"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#0556B3" stopOpacity={0.15} />
										<stop offset="95%" stopColor="#0556B3" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
										<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#e5e7eb"
								/>
								<XAxis
									dataKey="month"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "#6b7280" }}
									dy={5}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: "#6b7280" }}
									tickFormatter={(v) => formatCurrency(v)}
									width={60}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: "8px",
										border: "none",
										boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
									}}
									formatter={(value) => formatCurrency(Number(value) || 0)}
								/>
								<Legend
									wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }}
									iconType="circle"
									iconSize={6}
								/>
								<Area
									type="monotone"
									dataKey="value"
									name="Nilai Bulanan"
									stroke="#10b981"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorMonthly)"
									activeDot={{
										r: 4,
										fill: "#10b981",
										stroke: "#fff",
										strokeWidth: 1.5,
									}}
								/>
								<Area
									type="monotone"
									dataKey="cumulative"
									name="Akumulasi"
									stroke="#0556B3"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorCumulative)"
									activeDot={{
										r: 4,
										fill: "#0556B3",
										stroke: "#fff",
										strokeWidth: 1.5,
									}}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
}
