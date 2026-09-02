"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Package,
	Send,
	ArrowRight,
	RefreshCw,
	BarChart3,
	PieChart as PieIcon,
} from "lucide-react";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { buttonVariants } from "@/components/ui/button";

interface EquipmentItem {
	id: string;
	equipment_code: string;
	name: string;
	plant: string;
	category?: string;
	status_name: string;
}

interface ReuseRequestItem {
	id: string;
	request_number: string;
	equipment_code: string;
	equipment_name: string;
	installation_location: string;
	status: string;
}

/** Interaktivitas & visualisasi grafik dashboard unit kerja. */
export default function UnitKerjaDashboardContent({
	equipments,
	reuseRequests,
}: {
	equipments: EquipmentItem[];
	reuseRequests: ReuseRequestItem[];
}) {
	const router = useRouter();

	const readyToUseCount = equipments.length;
	const totalSubmittedRequests = reuseRequests.length;
	const pendingRequestsCount = reuseRequests.filter(
		(r) =>
			r.status.toUpperCase().includes("PENDING") ||
			r.status.toUpperCase().includes("REVIEW") ||
			r.status.toUpperCase().includes("MENUNGGU"),
	).length;
	const approvedRequests = reuseRequests.filter(
		(r) =>
			r.status.toUpperCase().includes("APPROV") ||
			r.status.toUpperCase().includes("DISETUJUI"),
	);

	// 1. Data Grafik 1: Visualisasi 4 Metrik Operasional Utama Unit Kerja
	const metricsBarData = useMemo(() => {
		return [
			{
				name: "Aset Siap Pakai",
				value: readyToUseCount,
				fill: "#059669",
				caption: "Tersedia di daftar aset",
			},
			{
				name: "Total Pengajuan",
				value: totalSubmittedRequests,
				fill: "#0556B3",
				caption: "Seluruh riwayat unit",
			},
			{
				name: "Menunggu Review",
				value: pendingRequestsCount,
				fill: "#B45309",
				caption: "Dalam evaluasi Rendal",
			},
			{
				name: "Disetujui Rendal",
				value: approvedRequests.length,
				fill: "#0A356A",
				caption: "Siap dimobilisasi",
			},
		];
	}, [readyToUseCount, totalSubmittedRequests, pendingRequestsCount, approvedRequests]);

	// 2. Data Grafik 2: Status Pengajuan Reuse Unit Kerja (Donut Chart)
	const { pieData, totalRequests } = useMemo(() => {
		let approved = 0;
		let pending = 0;
		let rejected = 0;

		reuseRequests.forEach((r) => {
			const s = r.status.toUpperCase();
			if (s.includes("APPROV") || s.includes("DISETUJUI")) {
				approved++;
			} else if (
				s.includes("REJECT") ||
				s.includes("DITOLAK") ||
				s.includes("REVISI")
			) {
				rejected++;
			} else {
				pending++;
			}
		});

		const total = approved + pending + rejected;

		const data = [
			{ name: "Disetujui", value: approved, color: "#059669" },
			{ name: "Menunggu Review", value: pending, color: "#0556B3" },
			{ name: "Perlu Revisi / Ditolak", value: rejected, color: "#DC2626" },
		].filter((item) => item.value > 0);

		if (data.length === 0) {
			data.push({ name: "Belum Ada Pengajuan", value: 1, color: "#E6E8EA" });
		}

		return {
			pieData: data,
			totalRequests: total,
		};
	}, [reuseRequests]);

	const getStatusBadge = (status: string) => {
		const s = status.toUpperCase();
		let label = "Menunggu Review";
		let style = "bg-[#FEF3C7] text-[#B45309]";
		if (s.includes("APPROV") || s.includes("DISETUJUI")) {
			label = "Disetujui";
			style = "bg-[#DCFCE7] text-[#16A34A]";
		} else if (s.includes("REJECT") || s.includes("DITOLAK")) {
			label = "Ditolak";
			style = "bg-[#FEE2E2] text-[#DC2626]";
		} else if (s.includes("REVISI") || s.includes("REVISION")) {
			label = "Perlu Revisi";
			style = "bg-[#E0F2FE] text-[#0284C7]";
		}
		return (
			<span
				className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style}`}
			>
				{label}
			</span>
		);
	};

	return (
		<div className="page-container flex flex-col gap-6">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Dashboard Unit Kerja Operasi</h1>
					<p className="page-subtitle">
						Ketersediaan aset idle dan status pengajuan penggunaan kembali dari unit
						kerja Anda.
					</p>
				</div>
				<div className="header-actions">
					<button
						type="button"
						onClick={() => router.refresh()}
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<RefreshCw className="w-4 h-4" />
						Muat Ulang
					</button>
					<Link
						href="/unit-kerja/daftar-aset"
						className={buttonVariants({ variant: "brand", size: "lg" })}
					>
						<Package className="w-4 h-4" />
						Daftar Aset
					</Link>
				</div>
			</div>

			{/* KPI strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div
					className="bg-white border border-[#E6E8EA] rounded-[4px] p-5 border-l-2"
					style={{ borderLeftColor: "#059669" }}
				>
					<p className="text-[12px] font-medium text-[#64748B]">Aset siap dipakai</p>
					<p className="text-[28px] font-semibold text-[#0F172A] tracking-[-0.02em] tabular-nums leading-tight mt-1">
						{String(readyToUseCount)}
					</p>
					<p className="text-[12px] text-[#64748B] mt-1">Tersedia di daftar aset</p>
				</div>
				<div
					className="bg-white border border-[#E6E8EA] rounded-[4px] p-5 border-l-2"
					style={{ borderLeftColor: "#0556B3" }}
				>
					<p className="text-[12px] font-medium text-[#64748B]">Total pengajuan</p>
					<p className="text-[28px] font-semibold text-[#0F172A] tracking-[-0.02em] tabular-nums leading-tight mt-1">
						{String(totalSubmittedRequests)}
					</p>
					<p className="text-[12px] text-[#64748B] mt-1">Seluruh riwayat unit</p>
				</div>
				<div
					className="bg-white border border-[#E6E8EA] rounded-[4px] p-5 border-l-2"
					style={{ borderLeftColor: "#B45309" }}
				>
					<p className="text-[12px] font-medium text-[#64748B]">Menunggu review</p>
					<p className="text-[28px] font-semibold text-[#0F172A] tracking-[-0.02em] tabular-nums leading-tight mt-1">
						{String(pendingRequestsCount)}
					</p>
					<p className="text-[12px] text-[#64748B] mt-1">Dalam evaluasi Rendal</p>
				</div>
				<div
					className="bg-white border border-[#E6E8EA] rounded-[4px] p-5 border-l-2"
					style={{ borderLeftColor: "#059669" }}
				>
					<p className="text-[12px] font-medium text-[#64748B]">Disetujui Rendal</p>
					<p className="text-[28px] font-semibold text-[#0F172A] tracking-[-0.02em] tabular-nums leading-tight mt-1">
						{String(approvedRequests.length)}
					</p>
					<p className="text-[12px] text-[#64748B] mt-1">Siap dimobilisasi</p>
				</div>
			</div>

			{/* Visualisasi Grafik: Rekapitulasi Metrik Operasional & Donut Status Pengajuan */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left: Bar Chart Rekapitulasi 4 Metrik Operasional Unit Kerja */}
				<div className="lg:col-span-2 bg-white border border-[#E6E8EA] rounded-[4px] p-5 flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between gap-3 mb-1">
							<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
								<BarChart3 className="w-4 h-4 text-[#0A356A]" />
								Rekapitulasi Operasional & Pengajuan Reuse
							</h3>
							<span className="text-[11px] text-[#64748B] font-medium bg-gray-50 px-2.5 py-0.5 rounded border border-[#E6E8EA]">
								Aktivitas Unit Kerja
							</span>
						</div>
						<p className="text-[12px] text-[#64748B] mb-4">
							Visualisasi perbandingan ketersediaan aset siap pakai dan status seluruh pengajuan peminjaman
						</p>

						<div className="border-t border-[#E6E8EA] pt-4">
							<div className="w-full h-64">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={metricsBarData}
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
											formatter={(value: any, name: any, item: any) => [
												`${value} Data`,
												item.payload.caption || item.payload.name,
											]}
										/>
										<Bar
											dataKey="value"
											name="Jumlah"
											radius={[3, 3, 0, 0]}
											maxBarSize={48}
										>
											{metricsBarData.map((entry, index) => (
												<Cell key={`bar-cell-${index}`} fill={entry.fill} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>

							<div className="mt-4 pt-3 border-t border-[#E6E8EA] flex flex-wrap items-center justify-between gap-3 text-[12px]">
								<div className="flex flex-wrap items-center gap-4">
									{metricsBarData.map((item) => (
										<span
											key={item.name}
											className="flex items-center gap-1.5 font-medium text-gray-700"
										>
											<span
												className="w-2.5 h-2.5 rounded-sm"
												style={{ backgroundColor: item.fill }}
											/>
											{item.name} ({item.value})
										</span>
									))}
								</div>
								<Link
									href="/unit-kerja/daftar-aset"
									className="text-[12px] font-medium text-[#0A356A] hover:text-[#0556B3] inline-flex items-center gap-1"
								>
									Daftar Aset
									<ArrowRight className="w-3.5 h-3.5" />
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* Right: Donut Chart Status Pengajuan Reuse Unit Kerja */}
				<div className="bg-white border border-[#E6E8EA] rounded-[4px] p-5 flex flex-col justify-between">
					<div>
						<h3 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
							<PieIcon className="w-4 h-4 text-[#0A356A]" />
							Status Pengajuan Reuse
						</h3>
						<p className="text-[12px] text-[#64748B] mt-0.5">
							Distribusi status pengajuan pinjam pakai unit Anda
						</p>
					</div>

					<div className="relative h-44 flex justify-center items-center my-3">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={pieData}
									cx="50%"
									cy="50%"
									innerRadius={48}
									outerRadius={68}
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
										fontSize: "12px",
										borderRadius: "4px",
										border: "1px solid #E6E8EA",
										boxShadow: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
									}}
									formatter={(value: any, name: any) => [`${value} Pengajuan`, name]}
								/>
							</PieChart>
						</ResponsiveContainer>
						<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
							<span className="text-[20px] font-bold text-[#0F172A] leading-none tabular-nums">
								{totalRequests}
							</span>
							<span className="text-[10px] text-[#64748B] font-medium mt-0.5">
								Pengajuan
							</span>
						</div>
					</div>

					<div className="space-y-1.5 pt-3 border-t border-[#E6E8EA]">
						<div className="flex items-center justify-between text-[11px]">
							<span className="flex items-center gap-1.5 text-gray-600">
								<span className="w-2 h-2 rounded-full bg-[#059669]" />
								Disetujui
							</span>
							<span className="font-semibold text-gray-900 tabular-nums">
								{approvedRequests.length}
							</span>
						</div>
						<div className="flex items-center justify-between text-[11px]">
							<span className="flex items-center gap-1.5 text-gray-600">
								<span className="w-2 h-2 rounded-full bg-[#0556B3]" />
								Menunggu Review
							</span>
							<span className="font-semibold text-gray-900 tabular-nums">
								{pendingRequestsCount}
							</span>
						</div>
						<div className="flex items-center justify-between text-[11px]">
							<span className="flex items-center gap-1.5 text-gray-600">
								<span className="w-2 h-2 rounded-full bg-[#DC2626]" />
								Perlu Revisi / Ditolak
							</span>
							<span className="font-semibold text-gray-900 tabular-nums">
								{Math.max(
									0,
									totalRequests - approvedRequests.length - pendingRequestsCount,
								)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Tabel Pengajuan Terbaru & Katalog Ringkas */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Pengajuan terbaru */}
				<div className="lg:col-span-2 bg-white border border-[#E6E8EA] rounded-[4px] overflow-hidden">
					<div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E8EA]">
						<div>
							<h2 className="text-[14px] font-semibold text-[#0F172A]">
								Pengajuan Reuse Terbaru
							</h2>
							<p className="text-[12px] text-[#64748B] mt-0.5">
								Lima pengajuan terakhir dari unit kerja Anda.
							</p>
						</div>
						<Link
							href="/unit-kerja/riwayat-permintaan"
							className="text-[12px] font-medium text-[#0A356A] hover:text-[#0556B3] inline-flex items-center gap-1"
						>
							Lihat riwayat
							<ArrowRight className="w-3.5 h-3.5" />
						</Link>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse">
							<thead>
								<tr className="bg-[#F2F3F4] border-b border-[#E6E8EA]">
									<th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
										No. Pengajuan
									</th>
									<th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
										Equipment
									</th>
									<th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
										Lokasi Instalasi
									</th>
									<th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#E6E8EA]">
								{reuseRequests.length === 0 ? (
									<tr>
										<td colSpan={4} className="px-4 py-10 text-center">
											<p className="text-[13px] text-[#64748B]">
												Belum ada pengajuan reuse
											</p>
											<Link
												href="/unit-kerja/daftar-aset"
												className="text-[12px] font-medium text-[#0A356A] hover:text-[#0556B3] mt-2 inline-flex items-center gap-1"
											>
												Buka Daftar Aset
												<ArrowRight className="w-3.5 h-3.5" />
											</Link>
										</td>
									</tr>
								) : (
									reuseRequests.slice(0, 5).map((req) => (
										<tr
											key={req.id}
											className="hover:bg-[#F2F3F4] transition-colors"
										>
											<td className="px-4 py-2.5 text-[13px] text-[#0A356A] font-medium whitespace-nowrap tabular-nums">
												{req.request_number}
											</td>
											<td className="px-4 py-2.5">
												<div className="text-[13px] text-[#0F172A]">
													{req.equipment_name}
												</div>
											</td>
											<td className="px-4 py-2.5 text-[13px] text-[#475569]">
												{req.installation_location}
											</td>
											<td className="px-4 py-2.5 whitespace-nowrap">
												{getStatusBadge(req.status)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Katalog ringkas */}
				<div className="bg-white border border-[#E6E8EA] rounded-[4px] overflow-hidden">
					<div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E8EA]">
						<h2 className="text-[14px] font-semibold text-[#0F172A]">
							Aset Siap Pakai ({equipments.length})
						</h2>
						<Link
							href="/unit-kerja/daftar-aset"
							className="text-[12px] font-medium text-[#0A356A] hover:text-[#0556B3]"
						>
							Lihat semua
						</Link>
					</div>

					<div className="divide-y divide-[#E6E8EA]">
						{equipments.length === 0 ? (
							<p className="px-5 py-6 text-[13px] text-[#64748B]">
								Tidak ada aset siap pakai saat ini.
							</p>
						) : (
							equipments.slice(0, 5).map((item) => (
								<div
									key={item.id}
									className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#F2F3F4] transition-colors"
								>
									<div className="min-w-0">
										<p
											className="text-[13px] text-[#0F172A] truncate"
											title={item.name}
										>
											{item.name}
										</p>
										<p className="text-[12px] text-[#64748B] tabular-nums truncate">
											{item.equipment_code} · {item.plant}
										</p>
									</div>
									<Link
										href="/unit-kerja/daftar-aset"
										className="shrink-0 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-[4px] border border-[#E6E8EA] text-[12px] font-medium text-[#334155] hover:bg-[#F2F3F4] transition-colors"
									>
										<Send className="w-3.5 h-3.5" />
										Ajukan
									</Link>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
