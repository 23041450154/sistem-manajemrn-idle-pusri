"use client";

/* DESIGN.md contract: palette row 102 + brand exception, radius 4px,
   status via 2px rule/border, no shadows on static surfaces. */

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
	Wrench,
	Clock,
	CheckCircle2,
	AlertTriangle,
	ClipboardCheck,
	RefreshCw,
	Search,
	ChevronRight,
	ArrowRight,
	FileText,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { statusGroup, statusName } from "@/lib/equipment-status";

/** Client Component: interaktif (search/filter) — data di-fetch Server Component. */
export default function InspeksiDashboardClient({
	equipments,
}: {
	equipments: any[];
}) {
	const [search, setSearch] = useState("");

	// Compute metrics
	const totalAssets = equipments.length;

	const pendingAssets = useMemo(() => {
		return equipments.filter((eq) => {
			const group = statusGroup(eq);
			return group === "pending" || !group;
		});
	}, [equipments]);

	const validatedAssetsCount = useMemo(() => {
		return equipments.filter((eq) => {
			const group = statusGroup(eq);
			return group === "ready";
		}).length;
	}, [equipments]);

	const repairOrScrapCount = useMemo(() => {
		return equipments.filter((eq) => {
			const group = statusGroup(eq);
			return group === "repair" || group === "scrap";
		}).length;
	}, [equipments]);

	// Filtered table queue
	const filteredPending = useMemo(() => {
		const q = search.toLowerCase().trim();
		if (!q) return pendingAssets;
		return pendingAssets.filter((eq) => {
			const code = eq.equipment_code || eq.kodeAlat || "";
			const name = eq.name || eq.namaAlat || "";
			const plant = eq.plant?.name || eq.plant || "";
			return (
				code.toLowerCase().includes(q) ||
				name.toLowerCase().includes(q) ||
				plant.toLowerCase().includes(q)
			);
		});
	}, [pendingAssets, search]);

	// DESIGN.md KPI card: one style, value-dominant, state carried by a 2px left rule.
	const kpis = [
		{
			label: "Total Peralatan",
			value: totalAssets,
			caption: "Total aset idle terdaftar",
			rule: "#334155",
			icon: FileText,
		},
		{
			label: "Menunggu Validasi",
			value: pendingAssets.length,
			caption: "Baru terdaftar, belum diperiksa",
			rule: "#0556B3",
			icon: Clock,
		},
		{
			label: "Tervalidasi / Ready",
			value: validatedAssetsCount,
			caption: "Layak operasional",
			rule: "#059669",
			icon: CheckCircle2,
		},
		{
			label: "Perbaikan / Scrap",
			value: repairOrScrapCount,
			caption: "Rusak atau tidak layak",
			rule: "#B45309",
			icon: AlertTriangle,
		},
	];

	// DESIGN.md module shortcut: divide-y nav rows, not equal icon-tile cards.
	const modules = [
		{
			href: "/inspeksi/validasi",
			title: "Validasi Kelayakan Aset",
			purpose: "Pemeriksaan fisik dan penetapan status kelayakan aset baru.",
			tag: "Pemeriksaan Awal",
			rule: "#0556B3",
			icon: ClipboardCheck,
		},
		{
			href: "/inspeksi/inspeksi-berkala",
			title: "Inspeksi Berkala",
			purpose: "Catat hasil inspeksi rutin untuk menjaga kondisi aset idle.",
			tag: "Monitoring Rutin",
			rule: "#334155",
			icon: RefreshCw,
		},
		{
			href: "/inspeksi/validasi-ulang",
			title: "Validasi Perbaikan Alat",
			purpose: "Uji ulang peralatan pasca perbaikan tim Pemeliharaan.",
			tag: "Pasca Perbaikan",
			rule: "#059669",
			icon: Wrench,
		},
	];

	return (
		<div className="page-container">
			{/* Page Header */}
			<header className="page-header">
				<div>
					<h1 className="page-title">Dashboard Inspeksi Teknik</h1>
					<p className="page-subtitle">
						Pengawasan kelayakan peralatan idle dan pemantauan inspeksi berkala.
					</p>
				</div>
				<div className="header-actions">
					<Link
						href="/inspeksi/inspeksi-berkala"
						className={buttonVariants({ variant: "brandOutline" })}
					>
						<ClipboardCheck data-icon="inline-start" className="h-4 w-4" />
						Inspeksi Berkala
					</Link>
					<Link
						href="/inspeksi/validasi"
						className={buttonVariants({ variant: "brand" })}
					>
						<CheckCircle2 data-icon="inline-start" className="h-4 w-4" />
						Validasi Kelayakan
					</Link>
				</div>
			</header>

			{/* KPI Strip */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{kpis.map((kpi) => (
					<div
						key={kpi.label}
						className="flex items-start justify-between gap-3 rounded border border-[#E6E8EA] border-l-2 bg-white p-4"
						style={{ borderLeftColor: kpi.rule }}
					>
						<div className="min-w-0">
							<p className="truncate text-[12px] font-medium text-[#64748B]">
								{kpi.label}
							</p>
							<p className="mt-2 text-[28px] leading-none font-semibold tracking-[-0.02em] text-[#0F172A] tabular-nums">
								{kpi.value}
							</p>
							<p className="mt-1.5 text-[12px] text-[#64748B]">{kpi.caption}</p>
						</div>
						<kpi.icon
							className="mt-0.5 h-4 w-4 shrink-0"
							style={{ color: kpi.rule }}
							aria-hidden="true"
						/>
					</div>
				))}
			</div>

			{/* Module Shortcuts */}
			<section
				aria-label="Modul inspeksi"
				className="overflow-hidden rounded border border-[#E6E8EA] bg-white"
			>
				<ul className="divide-y divide-[#E6E8EA]">
					{modules.map((mod) => (
						<li key={mod.href}>
							<Link
								href={mod.href}
								className="group relative flex items-center gap-4 px-5 py-4 transition-all duration-200 ease-in-out hover:bg-[#F8FAFC] hover:pl-6"
							>
								{/* Left accent bar on hover */}
								<span
									className="absolute inset-y-0 left-0 w-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									style={{ backgroundColor: mod.rule }}
									aria-hidden="true"
								/>
								<span
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white transition-all duration-200 ease-in-out group-hover:scale-110 group-hover:shadow-sm"
									style={{ borderColor: mod.rule, color: mod.rule }}
								>
									<mod.icon className="h-4 w-4 transition-transform duration-200 group-hover:rotate-3" aria-hidden="true" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-[14px] font-semibold text-[#0F172A] transition-colors duration-200 group-hover:text-[#0A356A]">
										{mod.title}
									</span>
									<span className="mt-0.5 block truncate text-[13px] text-[#64748B] transition-colors duration-200 group-hover:text-[#334155]">
										{mod.purpose}
									</span>
								</span>
								<span
									className="hidden shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-200 ease-in-out group-hover:scale-105 sm:inline-flex"
									style={{
										borderColor: `${mod.rule}40`,
										color: mod.rule,
										backgroundColor: `${mod.rule}10`,
									}}
								>
									{mod.tag}
								</span>
								<ChevronRight
									className="h-4 w-4 shrink-0 text-[#64748B] transition-all duration-200 ease-in-out group-hover:translate-x-1.5 group-hover:text-[#0A356A]"
									aria-hidden="true"
								/>
							</Link>
						</li>
					))}
				</ul>
			</section>

			{/* Table Section: Antrean Validasi Kelayakan Terbaru */}
			<section
				className="overflow-hidden rounded border border-[#E6E8EA] bg-white"
				aria-label="Antrean validasi kelayakan"
			>
				<div className="flex flex-col gap-3 border-b border-[#E6E8EA] p-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A]">
							Antrean Validasi Kelayakan
							<span
								className="inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-semibold"
								style={{ borderColor: "#0556B3", color: "#0556B3" }}
							>
								{pendingAssets.length} Menunggu
							</span>
						</h2>
						<p className="mt-0.5 text-[12px] text-[#64748B]">
							Peralatan terdaftar terbaru yang membutuhkan validasi teknis.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<div className="relative flex-1 sm:w-64">
							<Search
								className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
								aria-hidden="true"
							/>
							<input
								type="search"
								aria-label="Cari antrean validasi"
								placeholder="Cari kode/nama..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-8 w-full rounded border border-[#E6E8EA] bg-white pr-3 pl-8 text-[13px] text-[#0F172A] placeholder:text-[#64748B]"
							/>
						</div>
						<Link
							href="/inspeksi/validasi"
							className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-[#334155] transition-colors duration-150 hover:bg-[#F2F3F4] hover:text-[#0A356A]"
						>
							Lihat Semua
							<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
						</Link>
					</div>
				</div>

				{/* Table Content */}
				<div className="overflow-x-auto">
					<table className="w-full min-w-[860px] table-fixed border-collapse text-left">
						<thead>
							<tr className="border-b border-[#E6E8EA] bg-[#F2F3F4]">
								<th
									scope="col"
									className="w-12 px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									No
								</th>
								<th
									scope="col"
									className="w-[140px] px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Kode Alat
								</th>
								<th
									scope="col"
									className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Nama Peralatan
								</th>
								<th
									scope="col"
									className="w-[100px] px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Plant
								</th>
								<th
									scope="col"
									className="w-[130px] px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Tgl Registrasi
								</th>
								<th
									scope="col"
									className="w-[160px] px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Status
								</th>
								<th
									scope="col"
									className="w-[110px] px-4 py-2.5 text-center text-[11px] font-semibold tracking-[0.04em] text-[#334155] uppercase"
								>
									Aksi
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#E6E8EA]">
							{filteredPending.length === 0 ? (
								<tr>
									<td colSpan={7} className="px-4 py-14 text-center">
										<p className="text-[14px] font-semibold text-[#0F172A]">
											Tidak Ada Antrean
										</p>
										<p className="mt-1 text-[13px] text-[#64748B]">
											{search
												? "Tidak ada peralatan yang cocok dengan kata kunci pencarian."
												: "Tidak ada antrean validasi kelayakan saat ini."}
										</p>
									</td>
								</tr>
							) : (
								filteredPending.slice(0, 5).map((eq: any, idx: number) => (
									<tr
										key={eq.id || idx}
										className="transition-colors duration-150 hover:bg-[#F2F3F4]"
									>
										<td className="px-4 py-2.5 text-center text-[13px] text-[#64748B] tabular-nums">
											{idx + 1}
										</td>
										<td
											className="px-4 py-2.5 font-mono text-[13px] font-medium text-[#0F172A]"
											title={eq.equipment_code || eq.kodeAlat}
										>
											<span className="block truncate">
												{eq.equipment_code || eq.kodeAlat || "-"}
											</span>
										</td>
										<td
											className="px-4 py-2.5 text-[13px] font-medium text-[#0F172A]"
											title={eq.name || eq.namaAlat}
										>
											<span className="block truncate">
												{eq.name || eq.namaAlat || "-"}
											</span>
										</td>
										<td className="px-4 py-2.5 text-[13px] text-[#475569]">
											<span className="block truncate">
												{eq.plant?.name || eq.plant || "-"}
											</span>
										</td>
										<td className="px-4 py-2.5 text-[13px] text-[#475569] tabular-nums">
											{eq.created_at
												? new Date(eq.created_at).toLocaleDateString("id-ID")
												: "-"}
										</td>
										<td className="px-4 py-2.5 text-center">
											<span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap bg-[#E0F2FE] text-[#0284C7]">
												REGISTERED
											</span>
										</td>
										<td className="px-4 py-2.5 text-center whitespace-nowrap">
											<Link
												href="/inspeksi/validasi"
												className="inline-flex h-11 items-center justify-center gap-1.5 rounded bg-[#0A356A] px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#0556B3]"
											>
												<Wrench className="h-3.5 w-3.5" aria-hidden="true" />
												Validasi
											</Link>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
