"use client";

import React, { useState, useMemo } from "react";
import {
	CheckSquare,
	Server,
	Trash2,
	ArrowUpRight,
	ShieldCheck,
	TrendingUp,
	TrendingDown,
	Wallet,
	Sparkles,
	Calculator,
	Banknote,
	Coins,
	Database,
	Calendar,
	Filter,
	FileSpreadsheet,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	XAxis,
	YAxis,
	CartesianGrid,
	AreaChart,
	Area,
	Legend,
} from "recharts";
import { statusGroup } from "@/lib/equipment-status";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface ManajerDashboardClientProps {
	equipments: any[];
	validationApprovals: any[];
	reuseRequests: any[];
	disposals: any[];
	financialSummary?: any;
	financialTrend?: any[];
}

function formatRupiah(val: number) {
	if (isNaN(val) || val === 0) return "Rp 0";
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(val);
}

export default function ManajerDashboardClient({
	equipments,
	validationApprovals,
	reuseRequests,
	disposals,
}: ManajerDashboardClientProps) {
	const [filterMode, setFilterMode] = useState<"daily" | "monthly">("daily");
	const [showDetailTable, setShowDetailTable] = useState<boolean>(true);

	// 1. Hitung Pending Approvals
	const pendingValidations = useMemo(() => {
		return validationApprovals.filter(
			(a: any) =>
				a.approval_status === "PENDING" ||
				a.approval_status === "IN_REVIEW" ||
				!a.approval_status,
		);
	}, [validationApprovals]);

	const pendingReuses = useMemo(() => {
		return reuseRequests.filter((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			return st === "PENDING" || st === "IN_REVIEW" || st === "MENUNGGU_REVIEW" || !st;
		});
	}, [reuseRequests]);

	const pendingScraps = useMemo(() => {
		return disposals.filter((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || "").toUpperCase();
			return st === "PENDING" || st === "IN_REVIEW" || st === "DRAFT" || !st;
		});
	}, [disposals]);

	// 2. Metrik Valuasi Aset Idle Terdaftar
	const idleAssetValuation = useMemo(() => {
		let totalOriginal = 0;
		let totalBook = 0;
		let totalEstimatedReuse = 0;

		equipments.forEach((e: any) => {
			totalOriginal += Number(e.original_value) || 0;
			totalBook += Number(e.book_value) || 0;
			totalEstimatedReuse += Number(e.estimated_reuse_value) || 0;
		});

		return {
			totalOriginal,
			totalBook,
			totalEstimatedReuse,
		};
	}, [equipments]);

	// 3. Metrik Finansial (Cost Avoidance, Scrap Recovery & Biaya Perbaikan)
	const financialMetrics = useMemo(() => {
		let costAvoidance = 0;
		let newPurchaseTotal = 0;
		let refurbishmentTotal = 0;
		let scrapValue = 0;

		reuseRequests.forEach((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") {
				const estNew = Number(r.estimated_new_purchase_cost) || 0;
				const refCost = Number(r.refurbishment_cost) || 0;
				const avoidance = Math.max(0, Number(r.estimated_cost_avoidance) || (estNew - refCost));

				costAvoidance += avoidance;
				newPurchaseTotal += estNew;
				refurbishmentTotal += refCost;
			}
		});

		disposals.forEach((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || d.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") {
				scrapValue += Number(d.scrap_value) || 0;
			}
		});

		const totalSaving = costAvoidance + scrapValue;

		return {
			costAvoidance,
			newPurchaseTotal,
			refurbishmentTotal,
			scrapValue,
			totalSaving,
		};
	}, [reuseRequests, disposals]);

	// 4. Format Data Stock Market per TANGGAL (100% REAL DB Data)
	const dailyStockChartData = useMemo(() => {
		const dateMap = new Map<string, { dateKey: string; dateStr: string; timestamp: number; costAvoidance: number; scrapValue: number; total: number }>();

		reuseRequests.forEach((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") {
				const d = new Date(r.updated_at || r.created_at || Date.now());
				if (isNaN(d.getTime())) return;

				const dateKey = d.toISOString().split("T")[0];
				const displayDate = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

				const estNew = Number(r.estimated_new_purchase_cost) || 0;
				const refCost = Number(r.refurbishment_cost) || 0;
				const avoidance = Math.max(0, Number(r.estimated_cost_avoidance) || (estNew - refCost));

				const existing = dateMap.get(dateKey) || { dateKey, dateStr: displayDate, timestamp: d.getTime(), costAvoidance: 0, scrapValue: 0, total: 0 };
				existing.costAvoidance += avoidance;
				existing.total += avoidance;
				dateMap.set(dateKey, existing);
			}
		});

		disposals.forEach((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || d.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") {
				const dObj = new Date(d.updated_at || d.created_at || Date.now());
				if (isNaN(dObj.getTime())) return;

				const dateKey = dObj.toISOString().split("T")[0];
				const displayDate = dObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

				const scrap = Number(d.scrap_value) || 0;

				const existing = dateMap.get(dateKey) || { dateKey, dateStr: displayDate, timestamp: dObj.getTime(), costAvoidance: 0, scrapValue: 0, total: 0 };
				existing.scrapValue += scrap;
				existing.total += scrap;
				dateMap.set(dateKey, existing);
			}
		});

		let list = Array.from(dateMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

		if (list.length === 0) {
			const eqDatesMap = new Map<string, number>();
			equipments.forEach((e: any) => {
				const d = new Date(e.created_at || Date.now());
				if (!isNaN(d.getTime())) {
					const dateKey = d.toISOString().split("T")[0];
					eqDatesMap.set(dateKey, d.getTime());
				}
			});

			Array.from(eqDatesMap.entries()).sort(([a], [b]) => a.localeCompare(b)).forEach(([dateKey, ts]) => {
				const d = new Date(dateKey);
				const displayDate = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
				list.push({
					dateKey,
					dateStr: displayDate,
					timestamp: ts,
					costAvoidance: 0,
					scrapValue: 0,
					total: 0,
				});
			});
		}

		if (list.length === 1) {
			const single = list[0];
			const prevDate = new Date(single.timestamp - 86400000);
			list.unshift({
				dateKey: prevDate.toISOString().split("T")[0],
				dateStr: prevDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
				timestamp: prevDate.getTime(),
				costAvoidance: 0,
				scrapValue: 0,
				total: 0,
			});
		}

		return list;
	}, [reuseRequests, disposals, equipments]);

	// 5. Format Data Stock Market per BULAN (100% REAL DB Data)
	const monthlyStockChartData = useMemo(() => {
		const monthMap = new Map<string, { dateKey: string; dateStr: string; timestamp: number; costAvoidance: number; scrapValue: number; total: number }>();
		const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

		reuseRequests.forEach((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") {
				const d = new Date(r.updated_at || r.created_at || Date.now());
				if (isNaN(d.getTime())) return;

				const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
				const displayMonth = `${months[d.getMonth()]} ${d.getFullYear()}`;

				const estNew = Number(r.estimated_new_purchase_cost) || 0;
				const refCost = Number(r.refurbishment_cost) || 0;
				const avoidance = Math.max(0, Number(r.estimated_cost_avoidance) || (estNew - refCost));

				const existing = monthMap.get(monthKey) || { dateKey: monthKey, dateStr: displayMonth, timestamp: d.getTime(), costAvoidance: 0, scrapValue: 0, total: 0 };
				existing.costAvoidance += avoidance;
				existing.total += avoidance;
				monthMap.set(monthKey, existing);
			}
		});

		disposals.forEach((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || d.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") {
				const dObj = new Date(d.updated_at || d.created_at || Date.now());
				if (isNaN(dObj.getTime())) return;

				const monthKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}`;
				const displayMonth = `${months[dObj.getMonth()]} ${dObj.getFullYear()}`;

				const scrap = Number(d.scrap_value) || 0;

				const existing = monthMap.get(monthKey) || { dateKey: monthKey, dateStr: displayMonth, timestamp: dObj.getTime(), costAvoidance: 0, scrapValue: 0, total: 0 };
				existing.scrapValue += scrap;
				existing.total += scrap;
				monthMap.set(monthKey, existing);
			}
		});

		let list = Array.from(monthMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

		if (list.length === 0) {
			const curr = new Date();
			for (let i = 2; i >= 0; i--) {
				const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
				const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
				const displayMonth = `${months[d.getMonth()]} ${d.getFullYear()}`;
				list.push({
					dateKey: monthKey,
					dateStr: displayMonth,
					timestamp: d.getTime(),
					costAvoidance: 0,
					scrapValue: 0,
					total: 0,
				});
			}
		}

		if (list.length === 1) {
			const single = list[0];
			const prevDate = new Date(single.timestamp - 30 * 86400000);
			const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
			const prevDisplayMonth = `${months[prevDate.getMonth()]} ${prevDate.getFullYear()}`;
			list.unshift({
				dateKey: prevMonthKey,
				dateStr: prevDisplayMonth,
				timestamp: prevDate.getTime(),
				costAvoidance: 0,
				scrapValue: 0,
				total: 0,
			});
		}

		return list;
	}, [reuseRequests, disposals]);

	// Data Grafik Aktif Sesuai Filter (Harian vs Bulanan)
	const activeStockChartData = filterMode === "daily" ? dailyStockChartData : monthlyStockChartData;

	// Indikator Trend Saham: Naik (Hijau #059669) vs Turun (Merah #DC2626) vs Stabil
	const stockTrend = useMemo(() => {
		if (activeStockChartData.length < 2) {
			return {
				isUp: true,
				isDown: false,
				color: "#059669",
				label: "Trend Stabil (0%)",
			};
		}

		const current = activeStockChartData[activeStockChartData.length - 1].total;
		const previous = activeStockChartData[activeStockChartData.length - 2].total;

		if (current > previous) {
			let diffPct = "+100%";
			if (previous > 0) {
				const pct = ((current - previous) / previous) * 100;
				diffPct = `+${pct.toFixed(1)}%`;
			}
			return {
				isUp: true,
				isDown: false,
				color: "#059669",
				label: `Trend Naik (${diffPct})`,
			};
		} else if (current < previous) {
			let diffPct = "-100%";
			if (previous > 0) {
				const pct = ((previous - current) / previous) * 100;
				diffPct = `-${pct.toFixed(1)}%`;
			}
			return {
				isUp: false,
				isDown: true,
				color: "#DC2626",
				label: `Trend Turun (${diffPct})`,
			};
		} else {
			return {
				isUp: true,
				isDown: false,
				color: "#059669",
				label: "Trend Stabil (0%)",
			};
		}
	}, [activeStockChartData]);

	// Donut Chart: Status Keputusan Persetujuan Manajerial
	const { totalApprovalsCount, pieData, allStatusLegend } = useMemo(() => {
		let approved = 0;
		let pending = 0;
		let rejected = 0;

		validationApprovals.forEach((a: any) => {
			const st = (a.approval_status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") approved++;
			else if (st === "REJECTED" || st === "REVISION_REQUIRED" || st === "REVISION") rejected++;
			else pending++;
		});

		reuseRequests.forEach((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") approved++;
			else if (st === "REJECTED" || st === "DITOLAK") rejected++;
			else pending++;
		});

		disposals.forEach((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || d.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") approved++;
			else if (st === "REJECTED" || st === "DITOLAK") rejected++;
			else pending++;
		});

		const total = approved + pending + rejected;

		const legend = [
			{ name: "Sudah Disetujui", value: approved, color: "#059669" },
			{ name: "Menunggu Review", value: pending, color: "#0556B3" },
			{ name: "Ditolak / Revisi", value: rejected, color: "#DC2626" },
		];

		const data = legend.filter((item) => item.value > 0);

		if (data.length === 0) {
			data.push({ name: "Belum Ada Pengajuan", value: 1, color: "#E6E8EA" });
		}

		return {
			totalApprovalsCount: total,
			pieData: data,
			allStatusLegend: legend,
		};
	}, [validationApprovals, reuseRequests, disposals]);

	// Log Keputusan Terkini
	const recentDecisions = useMemo(() => {
		const list: { text: string; time: string; status: "APPROVED" | "REJECTED" | "PENDING" }[] = [];

		validationApprovals.slice(0, 3).forEach((a: any) => {
			const name = a.equipment_name || a.equipment?.name || "Aset";
			const code = a.equipment_code || a.equipment?.equipment_code || "";
			const st = (a.approval_status || "PENDING").toUpperCase();
			let text = "";
			if (st === "APPROVED") text = `Persetujuan validasi kelayakan: ${name} (${code}) disetujui`;
			else if (st === "REJECTED") text = `Persetujuan validasi: ${name} (${code}) ditolak/revisi`;
			else text = `Pengajuan validasi masuk: ${name} (${code}) menunggu review`;
			list.push({ text, time: a.request_date ? new Date(a.request_date).toLocaleDateString("id-ID") : "Baru saja", status: st as any });
		});

		reuseRequests.slice(0, 2).forEach((r: any) => {
			const eq = r.equipment || {};
			const name = eq.name || r.equipment_name || "Peralatan";
			const st = (r.approval_status || "PENDING").toUpperCase();
			let text = "";
			if (st === "APPROVED") text = `Permintaan reuse ${name} disetujui untuk ${r.requesting_plant || "Unit Operasi"}`;
			else text = `Permohonan pinjam pakai ${name} diajukan oleh ${r.requested_by_user?.name || "Unit Kerja"}`;
			list.push({ text, time: r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "Baru saja", status: st as any });
		});

		return list.slice(0, 4);
	}, [validationApprovals, reuseRequests]);

	const totalPendingApprovals =
		pendingValidations.length + pendingReuses.length + pendingScraps.length;

	const kpis = [
		{
			label: "Total Antrean Persetujuan",
			value: totalPendingApprovals.toString(),
			caption: "Menunggu review & keputusan",
			rule: "#0A356A",
			icon: CheckSquare,
		},
		{
			label: "Persetujuan Validasi",
			value: validationApprovals.length.toString(),
			caption:
				pendingValidations.length > 0
					? `${pendingValidations.length} menunggu review`
					: "0 antrean baru",
			rule: "#0556B3",
			icon: Server,
		},
		{
			label: "Persetujuan Peminjaman",
			value: reuseRequests.length.toString(),
			caption:
				pendingReuses.length > 0
					? `${pendingReuses.length} permohonan baru`
					: "0 permohonan baru",
			rule: "#B45309",
			icon: ArrowUpRight,
		},
		{
			label: "Persetujuan Scrap & Disposal",
			value: disposals.length.toString(),
			caption:
				pendingScraps.length > 0
					? `${pendingScraps.length} usulan penghapusan`
					: "0 usulan penghapusan",
			rule: "#DC2626",
			icon: Trash2,
		},
	];

	return (
		<div className="flex flex-col gap-6">
			{/* 1. Executive KPI Strip */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{kpis.map((kpi) => (
					<div
						key={kpi.label}
						className="bg-white rounded border border-[#E6E8EA] border-l-2 p-4 flex items-start justify-between gap-3 shadow-none"
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

			{/* 2. Main Section: Stock Market Style Financial Trend Chart */}
			<div className="bg-white rounded-lg border border-[#E6E8EA] p-6 shadow-sm flex flex-col gap-6">
				{/* Header Section */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E8EA] pb-4">
					<div>
						<h2 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
							{stockTrend.isDown ? (
								<TrendingDown className="w-5 h-5 text-[#DC2626]" />
							) : (
								<TrendingUp className="w-5 h-5 text-[#059669]" />
							)}
							Analisis Cost Avoidance & Dampak Finansial (Stock Market Trend)
						</h2>
						<p className="text-[12px] text-[#64748B] mt-0.5">
							Grafik pergerakan efisiensi finansial berdasarkan tanggal pengajuan real yang disetujui di Database.
						</p>
					</div>
					<div
						className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold ${
							stockTrend.isDown
								? "bg-[#FEF2F2] text-[#DC2626] border-[#FECDD3]"
								: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
						}`}
					>
						{stockTrend.isDown ? (
							<TrendingDown className="w-3.5 h-3.5 text-[#DC2626]" />
						) : (
							<TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
						)}
						<span>{stockTrend.label}</span>
					</div>
				</div>

				{/* 3 Valuasi Aset Terdaftar & Komponen Biaya Real-time */}
				<div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4">
					<div className="flex items-center justify-between mb-3 border-b border-[#E2E8F0] pb-2">
						<span className="text-[12px] font-bold text-[#0F172A] flex items-center gap-1.5">
							<Database className="w-4 h-4 text-[#0556B3]" />
							Ringkasan Valuasi Aset & Komponen Biaya (Database Real-time)
						</span>
						<span className="text-[10.5px] text-[#64748B]">
							{equipments.length} Total Aset Idle Terdaftar
						</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
						{/* 1. Nilai Perolehan Awal */}
						<div className="bg-white p-3 rounded border border-[#E2E8F0] flex items-center gap-3">
							<span className="p-2 bg-[#F1F5F9] text-[#475569] rounded-md">
								<Wallet className="w-4 h-4" />
							</span>
							<div>
								<p className="text-[11px] text-[#64748B] font-medium">Nilai Perolehan Awal (Registrasi Idle)</p>
								<p className="text-[15px] font-bold text-[#0F172A] tabular-nums mt-0.5">
									{formatRupiah(idleAssetValuation.totalOriginal)}
								</p>
							</div>
						</div>

						{/* 2. Estimasi Beli Alat Baru */}
						<div className="bg-white p-3 rounded border border-[#E2E8F0] flex items-center gap-3">
							<span className="p-2 bg-[#EFF6FF] text-[#0284C7] rounded-md">
								<Sparkles className="w-4 h-4" />
							</span>
							<div>
								<p className="text-[11px] text-[#64748B] font-medium">Estimasi Beli Baru (Permohonan Reuse)</p>
								<p className="text-[15px] font-bold text-[#0284C7] tabular-nums mt-0.5">
									{formatRupiah(financialMetrics.newPurchaseTotal)}
								</p>
							</div>
						</div>

						{/* 3. Biaya Perbaikan */}
						<div className="bg-white p-3 rounded border border-[#E2E8F0] flex items-center gap-3">
							<span className="p-2 bg-[#FEF2F2] text-[#DC2626] rounded-md">
								<Calculator className="w-4 h-4" />
							</span>
							<div>
								<p className="text-[11px] text-[#64748B] font-medium">Biaya Perbaikan (Pemeliharaan Lapangan)</p>
								<p className="text-[15px] font-bold text-[#DC2626] tabular-nums mt-0.5">
									{formatRupiah(financialMetrics.refurbishmentTotal)}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* 3 Financial KPI Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{/* Card 1: Total Saving / Untung */}
					<div className="bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF4] rounded-lg border border-[#A7F3D0] p-4 flex flex-col justify-between">
						<div className="flex items-center justify-between">
							<span className="text-[12px] font-semibold text-[#065F46]">Total Net Benefit (Saving)</span>
							<span className="p-2 bg-[#D1FAE5] text-[#059669] rounded-full">
								<TrendingUp className="w-4 h-4" />
							</span>
						</div>
						<div className="mt-3">
							<p className="text-[24px] font-bold text-[#064E3B] tracking-tight tabular-nums">
								{formatRupiah(financialMetrics.totalSaving)}
							</p>
							<p className="text-[11px] text-[#047857] mt-1 font-medium">
								Perolehan efisiensi finansial perusahaan
							</p>
						</div>
					</div>

					{/* Card 2: Cost Avoidance */}
					<div className="bg-gradient-to-br from-[#EFF6FF] to-[#F0F9FF] rounded-lg border border-[#BAE6FD] p-4 flex flex-col justify-between">
						<div className="flex items-center justify-between">
							<span className="text-[12px] font-semibold text-[#1E40AF]">Cost Avoidance (Beli Baru)</span>
							<span className="p-2 bg-[#DBEAFE] text-[#2563EB] rounded-full">
								<Banknote className="w-4 h-4" />
							</span>
						</div>
						<div className="mt-3">
							<p className="text-[24px] font-bold text-[#1E3A8A] tracking-tight tabular-nums">
								{formatRupiah(financialMetrics.costAvoidance)}
							</p>
							<p className="text-[11px] text-[#1D4ED8] mt-1 font-medium">
								Penghematan dari pemanfaatan reuse aset idle
							</p>
						</div>
					</div>

					{/* Card 3: Scrap Recovery */}
					<div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-lg border border-[#FDE68A] p-4 flex flex-col justify-between">
						<div className="flex items-center justify-between">
							<span className="text-[12px] font-semibold text-[#92400E]">Scrap Recovery (Disposal)</span>
							<span className="p-2 bg-[#FEF3C7] text-[#D97706] rounded-full">
								<Coins className="w-4 h-4" />
							</span>
						</div>
						<div className="mt-3">
							<p className="text-[24px] font-bold text-[#78350F] tracking-tight tabular-nums">
								{formatRupiah(financialMetrics.scrapValue)}
							</p>
							<p className="text-[11px] text-[#B45309] mt-1 font-medium">
								Hasil penjualan aset yang di-scrap
							</p>
						</div>
					</div>
				</div>

				{/* Full-Width Stock Market Chart with Filter Toggle & Table Rekapan */}
				<div className="border border-[#E6E8EA] rounded-lg p-5 bg-white shadow-sm">
					{/* Chart Control Header */}
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-[#F1F5F9] pb-3">
						<div>
							<h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
								{stockTrend.isUp ? (
									<TrendingUp className="w-4 h-4 text-[#059669]" />
								) : (
									<TrendingDown className="w-4 h-4 text-[#DC2626]" />
								)}
								Grafik Pergerakan Tren Keuangan ({filterMode === "daily" ? "Harian Per Tanggal" : "Bulanan Per Bulan"})
							</h3>
							<p className="text-[11px] text-[#64748B]">
								Warna kurva berubah otomatis: <span className="font-semibold text-[#059669]">Hijau (Naik/Stabil)</span> vs <span className="font-semibold text-[#DC2626]">Merah (Turun)</span>.
							</p>
						</div>

						{/* Filter Toggle Buttons (Harian vs Bulanan) */}
						<div className="flex items-center gap-2 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] shrink-0">
							<button
								type="button"
								onClick={() => setFilterMode("daily")}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
									filterMode === "daily"
										? "bg-[#0556B3] text-white shadow-sm font-semibold"
										: "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
								}`}
							>
								<Calendar className="w-3.5 h-3.5" />
								<span>Per Tanggal (Harian)</span>
							</button>
							<button
								type="button"
								onClick={() => setFilterMode("monthly")}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
									filterMode === "monthly"
										? "bg-[#0556B3] text-white shadow-sm font-semibold"
										: "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
								}`}
							>
								<Filter className="w-3.5 h-3.5" />
								<span>Per Bulan (Bulanan)</span>
							</button>
						</div>
					</div>

					{/* Recharts Area Container */}
					<div className="w-full h-80">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={activeStockChartData} margin={{ top: 16, right: 24, left: 16, bottom: 0 }}>
								<defs>
									<linearGradient id="stockTrendGradient" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor={stockTrend.color} stopOpacity={0.35} />
										<stop offset="95%" stopColor={stockTrend.color} stopOpacity={0.0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
								<XAxis
									dataKey="dateStr"
									tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
									axisLine={{ stroke: "#E2E8F0" }}
								/>
								<YAxis
									tick={{ fontSize: 10, fill: "#64748B" }}
									tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`}
									axisLine={false}
									tickLine={false}
								/>
								<Tooltip
									formatter={(value: any, name: any) => [formatRupiah(Number(value) || 0), name]}
									contentStyle={{
										borderRadius: "8px",
										border: "1px solid #CBD5E1",
										boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
										fontSize: "12px",
									}}
								/>
								<Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
								
								{/* Main Stock Trend Curve Line (Green if UP, Red if DOWN!) */}
								<Area
									type="monotone"
									dataKey="total"
									name={filterMode === "daily" ? "Total Saving Per Tanggal" : "Total Saving Per Bulan"}
									stroke={stockTrend.color}
									strokeWidth={3.5}
									fillOpacity={1}
									fill="url(#stockTrendGradient)"
									dot={{ r: 5, fill: stockTrend.color, strokeWidth: 2, stroke: "#FFFFFF" }}
									activeDot={{ r: 7, strokeWidth: 3 }}
								/>

								{/* Cost Avoidance Sub-curve */}
								<Area
									type="monotone"
									dataKey="costAvoidance"
									name="Cost Avoidance (Reuse)"
									stroke="#0556B3"
									strokeWidth={2}
									fillOpacity={0}
									dot={{ r: 3, fill: "#0556B3" }}
								/>

								{/* Scrap Recovery Sub-curve */}
								<Area
									type="monotone"
									dataKey="scrapValue"
									name="Hasil Scrap (Disposal)"
									stroke="#D97706"
									strokeWidth={2}
									fillOpacity={0}
									dot={{ r: 3, fill: "#D97706" }}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					{/* Tabel Rekapan Rincian Seluruh Tanggal / Bulan */}
					<div className="mt-6 border-t border-[#E2E8F0] pt-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
							<div className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A]">
								<FileSpreadsheet className="w-4 h-4 text-[#0556B3]" />
								<span>Tabel Rekapan Rincian Keuangan ({filterMode === "daily" ? "Per Tanggal" : "Per Bulan"})</span>
							</div>

							<div className="flex items-center gap-3 shrink-0">
								{/* Table Filter Switch */}
								<div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0]">
									<button
										type="button"
										onClick={() => setFilterMode("daily")}
										className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
											filterMode === "daily"
												? "bg-[#0556B3] text-white font-semibold shadow-sm"
												: "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
										}`}
									>
										<Calendar className="w-3 h-3" />
										<span>Per Tanggal</span>
									</button>
									<button
										type="button"
										onClick={() => setFilterMode("monthly")}
										className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
											filterMode === "monthly"
												? "bg-[#0556B3] text-white font-semibold shadow-sm"
												: "text-[#64748B] hover:text-[#0F172A] hover:bg-white"
										}`}
									>
										<Filter className="w-3 h-3" />
										<span>Per Bulan</span>
									</button>
								</div>

								<button
									type="button"
									onClick={() => setShowDetailTable(!showDetailTable)}
									className="flex items-center gap-1 text-[11px] font-medium text-[#0556B3] hover:underline"
								>
									<span>{showDetailTable ? "Sembunyikan Tabel" : "Tampilkan Rekapan Rincian"}</span>
									{showDetailTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
								</button>
							</div>
						</div>

						{showDetailTable && (
							<div className="overflow-x-auto rounded-lg border border-[#E2E8F0]">
								<table className="w-full text-[12px] text-left">
									<thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
										<tr>
											<th className="py-2.5 px-3">No</th>
											<th className="py-2.5 px-3">{filterMode === "daily" ? "Tanggal Transaksi" : "Bulan Transaksi"}</th>
											<th className="py-2.5 px-3">Cost Avoidance (Reuse)</th>
											<th className="py-2.5 px-3">Scrap Recovery (Disposal)</th>
											<th className="py-2.5 px-3">Total Net Benefit</th>
											<th className="py-2.5 px-3">Pergerakan Stock</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#E2E8F0] bg-white">
										{activeStockChartData.map((row, idx) => {
											const prevRow = idx > 0 ? activeStockChartData[idx - 1] : null;
											const isRowUp = !prevRow || row.total >= prevRow.total;
											return (
												<tr key={idx} className="hover:bg-[#F8FAFC]">
													<td className="py-2.5 px-3 text-[#64748B] font-mono">{idx + 1}</td>
													<td className="py-2.5 px-3 font-semibold text-[#0F172A]">{row.dateStr}</td>
													<td className="py-2.5 px-3 text-[#0556B3] tabular-nums font-medium">
														{formatRupiah(row.costAvoidance)}
													</td>
													<td className="py-2.5 px-3 text-[#D97706] tabular-nums font-medium">
														{formatRupiah(row.scrapValue)}
													</td>
													<td className="py-2.5 px-3 font-bold text-[#0F172A] tabular-nums">
														{formatRupiah(row.total)}
													</td>
													<td className="py-2.5 px-3 font-semibold">
														{isRowUp ? (
															<span className="inline-flex items-center gap-1 text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0] text-[11px]">
																<TrendingUp className="w-3 h-3" /> Naik / Stabil
															</span>
														) : (
															<span className="inline-flex items-center gap-1 text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECDD3] text-[11px]">
																<TrendingDown className="w-3 h-3" /> Turun
															</span>
														)}
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
			</div>

			{/* 3. Bottom Row: Donut Chart Status Persetujuan & Riwayat Keputusan Terkini */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Donut Status Persetujuan Manajerial */}
				<div className="bg-white rounded-lg border border-[#E6E8EA] p-5 shadow-sm flex flex-col justify-between">
					<div>
						<h3 className="text-[14px] font-semibold text-[#0F172A]">
							Status Persetujuan Manajerial
						</h3>
						<p className="text-[11px] text-[#64748B] mt-0.5">
							Distribusi status keputusan seluruh pengajuan masuk
						</p>
					</div>

					<div className="relative h-48 flex justify-center items-center my-3">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData}
									cx="50%"
									cy="50%"
									innerRadius={55}
									outerRadius={78}
									paddingAngle={3}
									dataKey="value"
									stroke="none"
								>
									{pieData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										borderRadius: "6px",
										border: "1px solid #E6E8EA",
										boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
										fontSize: "12px",
									}}
									formatter={(value) => `${value} Pengajuan`}
								/>
							</PieChart>
						</ResponsiveContainer>
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
							<span className="text-2xl font-bold text-[#0F172A] tabular-nums">
								{totalApprovalsCount}
							</span>
							<span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider">
								Total Pengajuan
							</span>
						</div>
					</div>

					<div className="space-y-2 border-t border-[#E6E8EA] pt-3">
						{allStatusLegend.map((item) => (
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
									{item.value} Pengajuan (
									{totalApprovalsCount > 0
										? Math.round((item.value / totalApprovalsCount) * 100)
										: 0}
									%)
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Log Keputusan & Aktivitas Terkini */}
				<div className="bg-white rounded-lg border border-[#E6E8EA] p-5 shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between mb-3 border-b border-[#E6E8EA] pb-2">
							<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-1.5">
								<ShieldCheck className="w-4 h-4 text-[#0A356A]" />
								Riwayat Keputusan Terkini
							</h3>
						</div>

						<div className="divide-y divide-[#E6E8EA]">
							{recentDecisions.length === 0 ? (
								<p className="text-[12px] text-[#64748B] text-center py-6">
									Belum ada riwayat persetujuan manajerial.
								</p>
							) : (
								recentDecisions.map((dec, idx) => (
									<div key={idx} className="py-3 flex items-start gap-2.5">
										<span
											className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
												dec.status === "APPROVED"
													? "bg-[#059669]"
													: dec.status === "REJECTED"
														? "bg-[#DC2626]"
														: "bg-[#0556B3]"
											}`}
										/>
										<div className="flex-1 min-w-0">
											<p className="text-[12px] text-[#0F172A] font-medium leading-snug">
												{dec.text}
											</p>
											<span className="text-[10px] text-[#64748B] block mt-0.5 font-mono">
												{dec.time}
											</span>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					<div className="mt-4 pt-3 border-t border-[#E6E8EA] text-[11px] text-[#64748B] text-right font-mono">
						Real-Time Audit Log
					</div>
				</div>
			</div>
		</div>
	);
}
