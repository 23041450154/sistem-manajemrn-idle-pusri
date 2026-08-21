"use client";

import {
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	Recycle,
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
	// Set ID aset yang ada di daftar disposals
	const disposalEquipmentIds = new Set(
		disposals
			.map((d: Equipment) => String(d.equipment_id || d.equipment?.id || d.id))
			.filter(Boolean),
	);

	// Kategorisasi setiap aset secara eksklusif dan lengkap (exhaustive)
	let menungguValidasiCount = 0;
	let dalamPerbaikanCount = 0;
	let readyCount = 0;
	let scrapCount = 0;

	equipments.forEach((e: Equipment) => {
		const st = (
			typeof e.status === "object" ? e.status?.name : e.status || e.statusAset || ""
		)
			.toUpperCase()
			.trim();
		const id = Number(e.status_id || e.status?.id || 0);
		const eqId = String(e.id || "");

		// 1. Scrap / Disposal
		if (
			id === 8 ||
			st.includes("SCRAP") ||
			st.includes("DISPOS") ||
			st.includes("TIDAK LAYAK") ||
			st.includes("CONDEMNED") ||
			st.includes("RUSAK_BERAT") ||
			st.includes("RUSAK BERAT") ||
			(eqId && disposalEquipmentIds.has(eqId))
		) {
			scrapCount++;
		}
		// 2. Dalam Perbaikan
		else if (
			id === 3 ||
			id === 4 ||
			id === 5 ||
			st.includes("PERBAIKAN") ||
			st.includes("REPAIR") ||
			st.includes("MAINTENANCE") ||
			st.includes("REVALIDATION") ||
			st.includes("REVALIDASI") ||
			st === "REJECTED"
		) {
			dalamPerbaikanCount++;
		}
		// 3. Ready to Use / Idle / Validated
		else if (
			id === 6 ||
			id === 2 ||
			id === 7 ||
			st.includes("READY") ||
			st.includes("VALID") ||
			st === "IDLE"
		) {
			readyCount++;
		}
		// 4. Menunggu Validasi (Status awal / Registered / Pending)
		else {
			menungguValidasiCount++;
		}
	});

	const totalUnit = equipments.length;

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
		} else if (status === "READY_TO_REUSE" || status === "READY TO USE" || status === "READY TO REUSE") {
			text = `Peralatan ${name} (${tag}) siap digunakan kembali (Ready to Use)`;
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
		{ name: "Scrap", value: scrapCount, color: "#8b5cf6" },
	].filter((item) => item.value > 0);

	if (pieData.length === 0) {
		pieData.push({ name: "Tidak Ada Data", value: 1, color: "#e5e7eb" });
	}

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
			label: "Ready to Use",
			value: readyCount,
			caption: "Siap digunakan kembali",
			rule: "#059669",
			icon: CheckCircle,
		},
		{
			label: "Menunggu Scrap",
			value: scrapCount,
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
							{scrapCount > 0 && (
								<div className="flex items-start gap-2.5 text-[13px] text-[#475569] py-2.5">
									<span
										className="w-0.5 self-stretch shrink-0 bg-[#475569]"
										aria-hidden="true"
									/>
									<div>
										<span className="font-semibold text-[#0F172A]">
											{scrapCount} aset menunggu proses scrap
										</span>
										. Tindak lanjuti usulan scrap.
									</div>
								</div>
							)}
							{menungguValidasiCount === 0 &&
								dalamPerbaikanCount === 0 &&
								scrapCount === 0 && (
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
								{totalUnit}
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
									{totalUnit > 0
										? Math.round((item.value / totalUnit) * 100)
										: 0}
									%)
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

		</div>
	);
}
