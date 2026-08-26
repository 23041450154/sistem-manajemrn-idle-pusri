"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
	CheckSquare,
	TrendingUp,
	Trash2,
	ArrowUpRight,
	Clock,
	CheckCircle2,
	AlertCircle,
	Check,
	ArrowRight,
	ShieldCheck,
	Coins,
	FileText,
	ChevronRight,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { statusGroup, statusBadgeStyle, statusText, rupiah } from "@/lib/equipment-status";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface ManajerDashboardClientProps {
	equipments: any[];
	validationApprovals: any[];
	reuseRequests: any[];
	disposals: any[];
}

export default function ManajerDashboardClient({
	equipments,
	validationApprovals,
	reuseRequests,
	disposals,
}: ManajerDashboardClientProps) {
	const [activeApprovalTab, setActiveApprovalTab] = useState<"validasi" | "reuse" | "scrap">("validasi");

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

	// 2. Hitung Metrik Finansial & Valuasi
	const {
		totalBookValue,
		totalEstimatedReuseValue,
		totalCostAvoidance,
		readyCount,
		dalamPerbaikanCount,
		menungguValidasiCount,
		scrapCount,
	} = useMemo(() => {
		let bookVal = 0;
		let reuseVal = 0;
		let ready = 0;
		let repair = 0;
		let pending = 0;
		let scrap = 0;

		equipments.forEach((e: any) => {
			const bv = Number(e.book_value || e.bookValue || e.original_value || 0);
			const rv = Number(e.estimated_reuse_value || e.estimatedReuseValue || 0);
			bookVal += bv;
			reuseVal += rv;

			const group = statusGroup(e);
			if (group === "ready") ready++;
			else if (group === "repair") repair++;
			else if (group === "scrap") scrap++;
			else pending++;
		});

		// Cost avoidance dari reuse requests yang disetujui + estimasi nilai reuse aset siap pakai
		let avoidanceFromReuseReqs = 0;
		reuseRequests.forEach((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") {
				avoidanceFromReuseReqs += Number(r.estimated_cost_avoidance || 0);
			}
		});

		// Jika belum ada request approved, gunakan total estimasi reuse value aset ready & reused sebagai basis
		const calculatedAvoidance =
			avoidanceFromReuseReqs > 0
				? avoidanceFromReuseReqs
				: equipments
						.filter((e: any) => {
							const grp = statusGroup(e);
							return grp === "ready";
						})
						.reduce(
							(sum: number, e: any) =>
								sum + Number(e.estimated_reuse_value || e.estimatedReuseValue || 0),
							0,
						);

		return {
			totalBookValue: bookVal,
			totalEstimatedReuseValue: reuseVal,
			totalCostAvoidance: calculatedAvoidance,
			readyCount: ready,
			dalamPerbaikanCount: repair,
			menungguValidasiCount: pending,
			scrapCount: scrap,
		};
	}, [equipments, reuseRequests]);

	// 3. Donut Chart Komposisi Nilai Aset
	const pieData = useMemo(() => {
		const data = [
			{ name: "Siap Re-use / Idle", value: readyCount, color: "#059669" },
			{ name: "Dalam Perbaikan", value: dalamPerbaikanCount, color: "#B45309" },
			{ name: "Menunggu Approval", value: menungguValidasiCount, color: "#0556B3" },
			{ name: "Rekomendasi Scrap", value: scrapCount, color: "#DC2626" },
		].filter((item) => item.value > 0);

		if (data.length === 0) {
			data.push({ name: "Belum Ada Data", value: 1, color: "#E6E8EA" });
		}
		return data;
	}, [readyCount, dalamPerbaikanCount, menungguValidasiCount, scrapCount]);

	// 4. Log Keputusan Terkini
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

	// KPI Cards
	const kpis = [
		{
			label: "Total Cost Avoidance",
			value: rupiah(totalCostAvoidance),
			caption: "Penghematan pengadaan baru",
			rule: "#059669",
			icon: TrendingUp,
			isCurrency: true,
		},
		{
			label: "Approval Validasi",
			value: pendingValidations.length.toString(),
			caption: "Menunggu approval inspeksi",
			rule: "#0556B3",
			icon: CheckSquare,
		},
		{
			label: "Approval Peminjaman",
			value: pendingReuses.length.toString(),
			caption: "Permohonan reuse unit kerja",
			rule: "#B45309",
			icon: ArrowUpRight,
		},
		{
			label: "Approval Scrap & Disposal",
			value: pendingScraps.length.toString(),
			caption: "Usulan penghapusan buku",
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
							<p
								className={`${
									kpi.isCurrency ? "text-[22px] lg:text-[24px]" : "text-[28px]"
								} leading-none font-semibold text-[#0F172A] tabular-nums mt-2 tracking-[-0.02em]`}
							>
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

			{/* 2. Middle Row: Inbox Persetujuan (Left 2 cols) vs Donut & Log Keputusan (Right 1 col) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column (2 cols) */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					{/* Inbox Persetujuan Manajer */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
							<div>
								<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
									<CheckSquare className="w-4 h-4 text-[#0A356A]" />
									Pusat Persetujuan Tertunda
								</h3>
								<p className="text-[12px] text-[#64748B] mt-0.5">
									Pengajuan yang memerlukan review dan keputusan Manajer Rendal
								</p>
							</div>

							{/* Tab selector */}
							<div className="inline-flex rounded-lg border border-[#E6E8EA] bg-gray-50/70 p-0.5">
								<button
									type="button"
									onClick={() => setActiveApprovalTab("validasi")}
									className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
										activeApprovalTab === "validasi"
											? "bg-white text-[#0A356A] shadow-sm"
											: "text-[#64748B] hover:text-[#0F172A]"
									}`}
								>
									Validasi ({pendingValidations.length})
								</button>
								<button
									type="button"
									onClick={() => setActiveApprovalTab("reuse")}
									className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
										activeApprovalTab === "reuse"
											? "bg-white text-[#0A356A] shadow-sm"
											: "text-[#64748B] hover:text-[#0F172A]"
									}`}
								>
									Peminjaman ({pendingReuses.length})
								</button>
								<button
									type="button"
									onClick={() => setActiveApprovalTab("scrap")}
									className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
										activeApprovalTab === "scrap"
											? "bg-white text-[#0A356A] shadow-sm"
											: "text-[#64748B] hover:text-[#0F172A]"
									}`}
								>
									Scrap ({pendingScraps.length})
								</button>
							</div>
						</div>

						{/* Tab 1: Validasi Kelayakan */}
						{activeApprovalTab === "validasi" && (
							<div className="border-t border-[#E6E8EA] pt-2">
								{pendingValidations.length === 0 ? (
									<div className="py-8 text-center text-[#64748B] text-[13px] flex flex-col items-center gap-1.5">
										<Check className="w-5 h-5 text-[#059669]" />
										<span>Tidak ada pengajuan validasi inspeksi yang tertunda.</span>
									</div>
								) : (
									<div className="divide-y divide-[#E6E8EA]">
										{pendingValidations.slice(0, 4).map((item: any, idx: number) => {
											const code = item.equipment_code || item.equipment?.equipment_code || "-";
											const name = item.equipment_name || item.equipment?.name || "Equipment";
											const plant = item.plant || item.equipment?.plant?.name || "-";
											const reqDate = item.request_date
												? new Date(item.request_date).toISOString().split("T")[0]
												: "-";

											return (
												<div
													key={item.id || idx}
													className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded transition-colors"
												>
													<div>
														<div className="flex items-center gap-2">
															<span className="font-semibold text-[#0A356A] text-[13px]">
																{code}
															</span>
															<span className="text-gray-300">•</span>
															<span className="font-medium text-[#0F172A] text-[13px]">
																{name}
															</span>
														</div>
														<p className="text-[12px] text-[#64748B] mt-0.5">
															Plant: {plant} • Diajukan: {reqDate} • No: {item.request_number || `REQ-${item.id}`}
														</p>
													</div>
													<Link
														href="/manajer/approve"
														className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-white bg-[#0A356A] hover:bg-[#0556B3] px-3 py-1.5 rounded transition-colors whitespace-nowrap"
													>
														<span>Review Validasi</span>
														<ChevronRight className="w-3.5 h-3.5" />
													</Link>
												</div>
											);
										})}
									</div>
								)}
								<div className="mt-3 pt-3 border-t border-[#E6E8EA] flex justify-end">
									<Link
										href="/manajer/approve"
										className="text-[12px] font-semibold text-[#0A356A] hover:text-[#0556B3] flex items-center gap-1"
									>
										<span>Buka Halaman Persetujuan Validasi</span>
										<ArrowRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							</div>
						)}

						{/* Tab 2: Peminjaman Reuse */}
						{activeApprovalTab === "reuse" && (
							<div className="border-t border-[#E6E8EA] pt-2">
								{pendingReuses.length === 0 ? (
									<div className="py-8 text-center text-[#64748B] text-[13px] flex flex-col items-center gap-1.5">
										<Check className="w-5 h-5 text-[#059669]" />
										<span>Tidak ada permohonan peminjaman reuse yang tertunda.</span>
									</div>
								) : (
									<div className="divide-y divide-[#E6E8EA]">
										{pendingReuses.slice(0, 4).map((item: any, idx: number) => {
											const eq = item.equipment || {};
											const code = eq.equipment_code || item.equipment_code || "-";
											const name = eq.name || item.equipment_name || "Equipment";
											const pemohon = item.requested_by_user?.name || item.requesting_unit || "Unit Operasi";
											const avoidance = Number(item.estimated_cost_avoidance) || 0;

											return (
												<div
													key={item.id || idx}
													className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded transition-colors"
												>
													<div>
														<div className="flex items-center gap-2">
															<span className="font-semibold text-[#0A356A] text-[13px]">
																{code}
															</span>
															<span className="text-gray-300">•</span>
															<span className="font-medium text-[#0F172A] text-[13px]">
																{name}
															</span>
														</div>
														<p className="text-[12px] text-[#64748B] mt-0.5">
															Pemohon: {pemohon} • Estimasi Cost Avoidance:{" "}
															<strong className="text-[#059669] font-bold">
																{avoidance > 0 ? rupiah(avoidance) : "-"}
															</strong>
														</p>
													</div>
													<Link
														href="/manajer/peminjaman"
														className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-white bg-[#0A356A] hover:bg-[#0556B3] px-3 py-1.5 rounded transition-colors whitespace-nowrap"
													>
														<span>Review Peminjaman</span>
														<ChevronRight className="w-3.5 h-3.5" />
													</Link>
												</div>
											);
										})}
									</div>
								)}
								<div className="mt-3 pt-3 border-t border-[#E6E8EA] flex justify-end">
									<Link
										href="/manajer/peminjaman"
										className="text-[12px] font-semibold text-[#0A356A] hover:text-[#0556B3] flex items-center gap-1"
									>
										<span>Buka Halaman Persetujuan Peminjaman</span>
										<ArrowRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							</div>
						)}

						{/* Tab 3: Scrap & Disposal */}
						{activeApprovalTab === "scrap" && (
							<div className="border-t border-[#E6E8EA] pt-2">
								{pendingScraps.length === 0 ? (
									<div className="py-8 text-center text-[#64748B] text-[13px] flex flex-col items-center gap-1.5">
										<Check className="w-5 h-5 text-[#059669]" />
										<span>Tidak ada pengajuan scrap atau disposal yang tertunda.</span>
									</div>
								) : (
									<div className="divide-y divide-[#E6E8EA]">
										{pendingScraps.slice(0, 4).map((item: any, idx: number) => {
											const eq = item.equipment || {};
											const code = eq.equipment_code || item.equipment_code || "-";
											const name = eq.name || item.equipment_name || "Equipment";
											const method = item.disposal_method?.name || item.disposal_method || "Scrap";
											const scrapVal = Number(item.scrap_value || eq.book_value || 0);

											return (
												<div
													key={item.id || idx}
													className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 px-2 rounded transition-colors"
												>
													<div>
														<div className="flex items-center gap-2">
															<span className="font-semibold text-[#0A356A] text-[13px]">
																{code}
															</span>
															<span className="text-gray-300">•</span>
															<span className="font-medium text-[#0F172A] text-[13px]">
																{name}
															</span>
														</div>
														<p className="text-[12px] text-[#64748B] mt-0.5">
															Metode: {method} • Nilai: {scrapVal > 0 ? rupiah(scrapVal) : "-"} • Alasan: {item.reason || "Rusak berat"}
														</p>
													</div>
													<Link
														href="/manajer/scrap"
														className="inline-flex items-center justify-center gap-1 text-[12px] font-semibold text-white bg-[#0A356A] hover:bg-[#0556B3] px-3 py-1.5 rounded transition-colors whitespace-nowrap"
													>
														<span>Review Scrap</span>
														<ChevronRight className="w-3.5 h-3.5" />
													</Link>
												</div>
											);
										})}
									</div>
								)}
								<div className="mt-3 pt-3 border-t border-[#E6E8EA] flex justify-end">
									<Link
										href="/manajer/scrap"
										className="text-[12px] font-semibold text-[#0A356A] hover:text-[#0556B3] flex items-center gap-1"
									>
										<span>Buka Halaman Persetujuan Scrap</span>
										<ArrowRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							</div>
						)}
					</div>

					{/* Ringkasan Valuasi Finansial */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5">
						<h3 className="text-[14px] font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
							<Coins className="w-4 h-4 text-[#059669]" />
							Valuasi Finansial & Potensi Aset Idle
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#E6E8EA] pt-3">
							<div className="p-3 bg-gray-50 rounded border border-[#E6E8EA]">
								<p className="text-[11px] font-medium text-[#64748B]">Total Nilai Buku (Book Value)</p>
								<p className="text-[16px] font-bold text-[#0F172A] mt-1 tabular-nums">
									{rupiah(totalBookValue)}
								</p>
								<p className="text-[10px] text-[#64748B] mt-0.5">Nilai aset tercatat di neraca</p>
							</div>

							<div className="p-3 bg-blue-50/60 rounded border border-blue-100">
								<p className="text-[11px] font-medium text-blue-800">Estimasi Nilai Pakai Ulang</p>
								<p className="text-[16px] font-bold text-[#0A356A] mt-1 tabular-nums">
									{rupiah(totalEstimatedReuseValue)}
								</p>
								<p className="text-[10px] text-blue-600 mt-0.5">Potensi recovery reuse</p>
							</div>

							<div className="p-3 bg-emerald-50/60 rounded border border-emerald-100">
								<p className="text-[11px] font-medium text-emerald-800">Realisasi Cost Avoidance</p>
								<p className="text-[16px] font-bold text-[#059669] mt-1 tabular-nums">
									{rupiah(totalCostAvoidance)}
								</p>
								<p className="text-[10px] text-emerald-600 mt-0.5">Efisiensi pengadaan riil</p>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column (1 col) */}
				<div className="flex flex-col gap-6">
					{/* Donut Status Valuasi */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5 flex flex-col justify-between">
						<div>
							<h3 className="text-[14px] font-semibold text-[#0F172A]">
								Komposisi Kelayakan Aset
							</h3>
							<p className="text-[11px] text-[#64748B] mt-0.5">
								Sebaran aset idle menurut kesiapan utilisasi
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
									{equipments.length}
								</span>
								<span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-wider">
									Total Unit
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
										{equipments.length > 0
											? Math.round((item.value / equipments.length) * 100)
											: 0}
										%)
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Log Keputusan & Aktivitas Terkini */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-1.5">
								<ShieldCheck className="w-4 h-4 text-[#0A356A]" />
								Riwayat Keputusan Terkini
							</h3>
						</div>

						<div className="divide-y divide-[#E6E8EA] border-t border-[#E6E8EA]">
							{recentDecisions.length === 0 ? (
								<p className="text-[12px] text-[#64748B] text-center py-4">
									Belum ada riwayat persetujuan manajerial.
								</p>
							) : (
								recentDecisions.map((dec, idx) => (
									<div key={idx} className="py-2.5 flex items-start gap-2.5">
										<span
											className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
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
											<span className="text-[10px] text-[#64748B] block mt-0.5">
												{dec.time}
											</span>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
