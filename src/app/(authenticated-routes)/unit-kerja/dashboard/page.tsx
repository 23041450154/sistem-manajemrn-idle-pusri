"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEquipments, getReuseRequests } from "@/action/api";
import { Package, Send, ArrowRight, RefreshCw } from "lucide-react";
import styles from "@/app/(authenticated-routes)/dashboard.module.css";

/** ponytail: API rows are untyped JSON; every field is narrowed at the mapping boundary below.
 * Upgrade path: generate types from the backend OpenAPI/Prisma schema. */
type ApiRow = Record<string, unknown>;

const str = (...vals: unknown[]): string => {
	for (const v of vals) {
		if (typeof v === "string" && v) return v;
		if (typeof v === "number") return String(v);
		if (v && typeof v === "object") {
			const name = (v as ApiRow).name ?? (v as ApiRow).plant;
			if (typeof name === "string" && name) return name;
		}
	}
	return "-";
};

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
	estimated_cost_avoidance?: number;
	status: string;
}

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

export default function UnitKerjaDashboardPage() {
	const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
	const [reuseRequests, setReuseRequests] = useState<ReuseRequestItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const [rawEqList, rawRequests] = await Promise.all([
				getEquipments().catch(() => []),
				getReuseRequests().catch(() => []),
			]);

			const mappedEquipments: EquipmentItem[] = (rawEqList || []).map(
				(item: ApiRow) => {
					const rawStatus = str(item.status, "").toUpperCase();
					const isReady =
						rawStatus.includes("READY") ||
						rawStatus.includes("SIAP") ||
						rawStatus.includes("VALID");

					return {
						id: String(item.id),
						equipment_code: str(item.equipment_code, `EQ-${item.id}`),
						name: str(item.name, item.nama),
						plant: str(item.plant),
						status_name: isReady ? "READY_TO_REUSE" : "IDLE",
					};
				},
			);

			const reqList: ReuseRequestItem[] = (rawRequests || []).map(
				(r: ApiRow) => {
					const equipment = (r.equipment ?? {}) as ApiRow;
					return {
						id: String(r.id),
						request_number: str(
							r.request_number,
							r.requestNumber,
							`REQ-${r.id}`,
						),
						equipment_code: str(
							r.equipment_code,
							r.equipmentCode,
							equipment.equipment_code,
						),
						equipment_name: str(
							r.equipment_name,
							r.equipmentName,
							equipment.name,
						),
						installation_location: str(
							r.installation_location,
							r.installationLocation,
						),
						estimated_cost_avoidance:
							Number(r.estimated_cost_avoidance ?? r.estimatedCostAvoidance) ||
							0,
						status: str(
							r.status,
							r.approval_status,
							r.approvalStatus,
							"PENDING",
						),
					};
				},
			);

			setEquipments(
				mappedEquipments.filter(
					(e) => e.status_name === "READY_TO_REUSE" || e.status_name === "IDLE",
				),
			);
			setReuseRequests(reqList);
		} catch (err) {
			console.error("Dashboard fetch error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchData();
	}, []);

	const readyToUseCount = equipments.length;
	const totalSubmittedRequests = reuseRequests.length;
	const approvedRequests = reuseRequests.filter((r) =>
		r.status.toUpperCase().includes("APPROV"),
	);
	const pendingRequestsCount = reuseRequests.filter(
		(r) =>
			r.status.toUpperCase().includes("PENDING") ||
			r.status.toUpperCase().includes("REVIEW"),
	).length;
	const totalCostAvoidance = approvedRequests.reduce(
		(sum, item) => sum + (item.estimated_cost_avoidance || 0),
		0,
	);

	const getStatusBadge = (status: string) => {
		const s = status.toUpperCase();
		let label = "Menunggu Review";
		let hue = "#B45309";
		if (s.includes("APPROV")) {
			label = "Disetujui";
			hue = "#059669";
		} else if (s.includes("REJECT")) {
			label = "Ditolak";
			hue = "#DC2626";
		} else if (s.includes("REVISI") || s.includes("REVISION")) {
			label = "Perlu Revisi";
			hue = "#0556B3";
		}
		return (
			<span
				className="inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[11px] font-semibold"
				style={{ color: hue, borderColor: hue }}
			>
				{label}
			</span>
		);
	};

	return (
		<div className={styles.pageContainer}>
			{/* Header */}
			<div className={styles.pageHeader}>
				<div>
					<h1 className={styles.pageTitle}>Dashboard Unit Kerja Operasi</h1>
					<p className={styles.pageSubtitle}>
						Ketersediaan aset idle dan status pengajuan penggunaan kembali dari
						unit kerja Anda.
					</p>
				</div>
				<div className={styles.headerActions}>
					<button
						onClick={fetchData}
						disabled={isLoading}
						className={styles.btnOutline}
					>
						<RefreshCw
							className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
						/>
						Muat Ulang
					</button>
					<Link href="/unit-kerja/katalog" className={styles.btnPrimary}>
						<Package className="w-4 h-4" />
						Katalog Aset
					</Link>
				</div>
			</div>

			{/* KPI strip */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<KpiCard
					label="Aset siap dipakai"
					value={String(readyToUseCount)}
					caption="Tersedia di katalog"
					rule="#059669"
				/>
				<KpiCard
					label="Total pengajuan"
					value={String(totalSubmittedRequests)}
					caption={`${pendingRequestsCount} menunggu review`}
					rule="#0556B3"
				/>
				<KpiCard
					label="Disetujui Rendal"
					value={String(approvedRequests.length)}
					caption="Siap dimobilisasi"
					rule="#059669"
				/>
				<KpiCard
					label="Cost avoidance"
					value={`Rp ${totalCostAvoidance.toLocaleString("id-ID")}`}
					caption="Dari pengajuan disetujui"
					rule="#475569"
				/>
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
								{isLoading ? (
									<tr>
										<td colSpan={4} className="px-4 py-10 text-center">
											<RefreshCw className="w-5 h-5 text-[#0A356A] animate-spin mx-auto mb-2" />
											<p className="text-[13px] text-[#64748B]">
												Memuat pengajuan...
											</p>
										</td>
									</tr>
								) : reuseRequests.length === 0 ? (
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
												<div className="text-[12px] text-[#64748B] tabular-nums">
													{req.equipment_code}
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
							Aset Idle ({equipments.length})
						</h2>
						<Link
							href="/unit-kerja/katalog"
							className="text-[12px] font-medium text-[#0A356A] hover:text-[#0556B3]"
						>
							Lihat semua
						</Link>
					</div>

					<div className="divide-y divide-[#E6E8EA]">
						{isLoading ? (
							<p className="px-5 py-6 text-[13px] text-[#64748B]">
								Memuat katalog...
							</p>
						) : equipments.length === 0 ? (
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
										href="/unit-kerja/katalog"
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
