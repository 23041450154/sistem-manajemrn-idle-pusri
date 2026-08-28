"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Send, ArrowRight, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface EquipmentItem {
	id: string;
	equipment_code: string;
	name: string;
	plant: string;
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

/** Interaktivitas saja (tombol refresh) — data sudah di-fetch di Server Component. */
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
			r.status.toUpperCase().includes("REVIEW"),
	).length;
	const approvedRequests = reuseRequests.filter((r) =>
		r.status.toUpperCase().includes("APPROV"),
	);

	const getStatusBadge = (status: string) => {
		const s = status.toUpperCase();
		let label = "Menunggu Review";
		let style = "bg-[#FEF3C7] text-[#B45309]";
		if (s.includes("APPROV")) {
			label = "Disetujui";
			style = "bg-[#DCFCE7] text-[#16A34A]";
		} else if (s.includes("REJECT")) {
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
		<div className="page-container">
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
						href="/unit-kerja/katalog"
						className={buttonVariants({ variant: "brand", size: "lg" })}
					>
						<Package className="w-4 h-4" />
						Katalog Aset
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
					<p className="text-[12px] text-[#64748B] mt-1">Tersedia di katalog</p>
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

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
											<p className="text-[13px] text-[#0F172A]">
												Belum ada pengajuan reuse
											</p>
											<Link
												href="/unit-kerja/katalog"
												className="text-[12px] font-medium text-[#0A356A] hover:text-[#0556B3] mt-1 inline-block"
											>
												Buka katalog aset idle
											</Link>
										</td>
									</tr>
								) : (
									reuseRequests.slice(0, 5).map((req) => (
										<tr key={req.id} className="hover:bg-[#F2F3F4] transition-colors">
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
										<p className="text-[13px] text-[#0F172A] truncate" title={item.name}>
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
