"use client";

import React, { useMemo } from "react";
import {
	CheckSquare,
	Server,
	Trash2,
	ArrowUpRight,
	ShieldCheck,
	BarChart3,
} from "lucide-react";
import {
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Tooltip,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
} from "recharts";
import { statusGroup } from "@/lib/equipment-status";

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

	// 2. Hitung Metrik Status Operasional & Kesiapan Aset
	const {
		readyCount,
		dalamPerbaikanCount,
		menungguValidasiCount,
		scrapCount,
	} = useMemo(() => {
		let ready = 0;
		let repair = 0;
		let pending = 0;
		let scrap = 0;

		equipments.forEach((e: any) => {
			const group = statusGroup(e);
			if (group === "ready") ready++;
			else if (group === "repair") repair++;
			else if (group === "scrap") scrap++;
			else pending++;
		});

		return {
			readyCount: ready,
			dalamPerbaikanCount: repair,
			menungguValidasiCount: pending,
			scrapCount: scrap,
		};
	}, [equipments]);

	const totalUnit = equipments.length;

	// Data Grafik 1: Rekapitulasi Alur Persetujuan Manajer
	const approvalBarData = useMemo(() => {
		const valApproved = validationApprovals.filter(
			(a: any) => (a.approval_status || "").toUpperCase() === "APPROVED",
		).length;
		const valRejected = validationApprovals.filter((a: any) => {
			const st = (a.approval_status || "").toUpperCase();
			return st === "REJECTED" || st === "REVISION_REQUIRED" || st === "REVISION";
		}).length;

		const reuseApproved = reuseRequests.filter((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			return st === "APPROVED" || st === "DISETUJUI";
		}).length;
		const reuseRejected = reuseRequests.filter((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			return st === "REJECTED" || st === "DITOLAK";
		}).length;

		const scrapApproved = disposals.filter((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || d.status || "").toUpperCase();
			return st === "APPROVED" || st === "DISETUJUI";
		}).length;
		const scrapRejected = disposals.filter((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || d.status || "").toUpperCase();
			return st === "REJECTED" || st === "DITOLAK";
		}).length;

		return [
			{
				name: "Validasi Kelayakan",
				pending: pendingValidations.length,
				approved: valApproved,
				rejected: valRejected,
				total: validationApprovals.length,
			},
			{
				name: "Peminjaman Reuse",
				pending: pendingReuses.length,
				approved: reuseApproved,
				rejected: reuseRejected,
				total: reuseRequests.length,
			},
			{
				name: "Scrap & Disposal",
				pending: pendingScraps.length,
				approved: scrapApproved,
				rejected: scrapRejected,
				total: disposals.length,
			},
		];
	}, [validationApprovals, reuseRequests, disposals, pendingValidations, pendingReuses, pendingScraps]);

	// 3. Donut Chart: Status Keputusan Persetujuan Manajerial
	const { totalApprovalsCount, pieData } = useMemo(() => {
		let approved = 0;
		let pending = 0;
		let rejected = 0;

		// Validation
		validationApprovals.forEach((a: any) => {
			const st = (a.approval_status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") approved++;
			else if (st === "REJECTED" || st === "REVISION_REQUIRED" || st === "REVISION") rejected++;
			else pending++;
		});

		// Reuse
		reuseRequests.forEach((r: any) => {
			const st = (r.approval_status || r.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") approved++;
			else if (st === "REJECTED" || st === "DITOLAK") rejected++;
			else pending++;
		});

		// Disposal / Scrap
		disposals.forEach((d: any) => {
			const st = (d.approval_status || d.approval?.approval_status || d.status || "").toUpperCase();
			if (st === "APPROVED" || st === "DISETUJUI") approved++;
			else if (st === "REJECTED" || st === "DITOLAK") rejected++;
			else pending++;
		});

		const total = approved + pending + rejected;

		const data = [
			{ name: "Sudah Disetujui", value: approved, color: "#059669" },
			{ name: "Menunggu Review", value: pending, color: "#0556B3" },
			{ name: "Ditolak / Revisi", value: rejected, color: "#DC2626" },
		].filter((item) => item.value > 0);

		if (data.length === 0) {
			data.push({ name: "Belum Ada Pengajuan", value: 1, color: "#E6E8EA" });
		}

		return {
			totalApprovalsCount: total,
			pieData: data,
		};
	}, [validationApprovals, reuseRequests, disposals]);

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

	const totalPendingApprovals =
		pendingValidations.length + pendingReuses.length + pendingScraps.length;

	// KPI Cards specification (100% Manajerial Approvals Governance)
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
					? `${pendingValidations.length} menunggu, ${approvalBarData[0].approved} disetujui`
					: `${approvalBarData[0].approved} sudah disetujui`,
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

			{/* 2. Middle Row: Grafik Rekapitulasi Alur Persetujuan (Left 2 cols) vs Donut & Log Keputusan (Right 1 col) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column (2 cols) */}
				<div className="lg:col-span-2 flex flex-col">
					{/* Grafik Rekapitulasi Alur Persetujuan Manajerial */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5 flex flex-col justify-between h-full">
						<div>
							<div className="flex items-center justify-between gap-3 mb-1">
								<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
									<BarChart3 className="w-4 h-4 text-[#0A356A]" />
									Rekapitulasi Alur Persetujuan Manajerial
								</h3>
								<span className="text-[11px] text-[#64748B] font-medium bg-gray-50 px-2.5 py-0.5 rounded border border-[#E6E8EA]">
									Total {validationApprovals.length + reuseRequests.length + disposals.length} Pengajuan
								</span>
							</div>
							<p className="text-[12px] text-[#64748B] mb-4">
								Perbandingan volume pengajuan persetujuan yang ditangani Manajer Rendal per kategori alur
							</p>

							<div className="border-t border-[#E6E8EA] pt-4">
								<div className="w-full h-80">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={approvalBarData}
											margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="#E6E8EA"
												vertical={false}
											/>
											<XAxis
												dataKey="name"
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
												formatter={(value: any, name: any) => [`${value} Pengajuan`, name]}
											/>
											<Bar
												dataKey="pending"
												name="Menunggu Review"
												fill="#0556B3"
												radius={[3, 3, 0, 0]}
												maxBarSize={32}
											/>
											<Bar
												dataKey="approved"
												name="Disetujui"
												fill="#059669"
												radius={[3, 3, 0, 0]}
												maxBarSize={32}
											/>
											<Bar
												dataKey="rejected"
												name="Ditolak / Revisi"
												fill="#DC2626"
												radius={[3, 3, 0, 0]}
												maxBarSize={32}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>

								{/* Legend & mini stats */}
								<div className="mt-4 pt-3 border-t border-[#E6E8EA] flex flex-wrap items-center justify-between gap-3 text-[12px]">
									<div className="flex items-center gap-4">
										<span className="flex items-center gap-1.5 text-[#0556B3] font-medium">
											<span className="w-2.5 h-2.5 rounded-sm bg-[#0556B3]" />
											Menunggu Review ({pendingValidations.length + pendingReuses.length + pendingScraps.length})
										</span>
										<span className="flex items-center gap-1.5 text-[#059669] font-medium">
											<span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
											Disetujui ({approvalBarData.reduce((s, d) => s + d.approved, 0)})
										</span>
										<span className="flex items-center gap-1.5 text-[#DC2626] font-medium">
											<span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
											Ditolak / Revisi ({approvalBarData.reduce((s, d) => s + d.rejected, 0)})
										</span>
									</div>
									<span className="text-[#64748B] text-[11px]">
										3 Alur: Validasi Kelayakan, Peminjaman Reuse, Scrap & Disposal
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column (1 col) */}
				<div className="flex flex-col gap-6">
					{/* Donut Status Persetujuan Manajerial */}
					<div className="bg-white rounded border border-[#E6E8EA] p-5 flex flex-col justify-between">
						<div>
							<h3 className="text-[14px] font-semibold text-[#0F172A]">
								Status Persetujuan Manajerial
							</h3>
							<p className="text-[11px] text-[#64748B] mt-0.5">
								Distribusi status keputusan seluruh pengajuan masuk
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
