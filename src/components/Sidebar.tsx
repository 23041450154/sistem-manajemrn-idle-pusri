"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
import { MASTER_ENTITIES } from "@/lib/master-entities";
import {
	LayoutDashboard,
	Wrench,
	PowerOff,
	ClipboardCheck,
	FileQuestion,
	CheckSquare,
	FileText,
	Inbox,
	Database,
	Users,
	Settings,
	Plus,
	Trash2,
	Edit,
	X,
	ShieldCheck,
	ChevronDown,
  ChevronRight,
	Factory,
  Cog,
  History,
  RefreshCw,
} from "lucide-react";
import { useSidebar } from "./SidebarProvider";
import { useState, useEffect } from "react";
import { getEquipments, getApprovals } from "@/action/api";

export function Sidebar({ role }: { role?: string }) {
	const pathname = usePathname();
	const { isOpen, closeSidebar } = useSidebar();
	const [masterDataOpen, setMasterDataOpen] = useState(
		pathname.startsWith("/admin/master"),
	);
	const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});

	useEffect(() => {
		let isMounted = true;
		const checkPending = async () => {
			try {
				const [data, approvalsData] = await Promise.all([
					getEquipments(),
					getApprovals().catch(() => []),
				]);
				if (!Array.isArray(data) || !isMounted) return;

				const approvalsList = Array.isArray(approvalsData)
					? approvalsData
					: (approvalsData as any)?.data || [];

				// Validasi Kelayakan (/inspeksi/validasi): HANYA aset yang butuh tindakan Inspeksi (REGISTERED / REVISION_REQUIRED)
				const validasiAntrean = data.filter((item: any) => {
					const statusName = String(item.status?.name || item.statusAset || "").toUpperCase();
					const statusId = item.status_id || item.status?.id;

					const matchingApproval = approvalsList.find(
						(a: any) =>
							String(a.equipment_id) === String(item.id) ||
							String(a.equipment?.id) === String(item.id),
					);

					const isRevisionRequired = matchingApproval?.approval_status === "REVISION_REQUIRED";
					const isRegistered = statusId === 1 || statusName === "REGISTERED";

					return isRegistered || isRevisionRequired;
				}).length;

				// Validasi Perbaikan Alat (/inspeksi/validasi-ulang):
				const validasiUlangAntrean = data.filter((item: any) => {
					const statusName = String(item.status?.name || item.statusAset || "").toUpperCase();
					const statusId = item.status_id || item.status?.id;
					return (
						statusId === 4 ||
						statusName === "REPAIR_COMPLETED" ||
						statusName === "REPAIR COMPLETED"
					);
				}).length;

				// Persetujuan Perbaikan (/rendal/validasi-ulang):
				const rendalValidasiUlangAntrean = data.filter((item: any) => {
					const statusName = String(item.status?.name || item.statusAset || "").toUpperCase();
					const statusId = item.status_id || item.status?.id;
					return statusId === 5 || statusName === "REVALIDATION" || statusName === "REVALIDASI";
				}).length;

				// Perbaikan Alat (/pemeliharaan/perbaikan-alat):
				const perbaikanAntrean = data.filter((item: any) => {
					const statusName = String(item.status?.name || item.statusAset || "").toUpperCase();
					const statusId = item.status_id || item.status?.id;
					return statusId === 3 || statusName === "REPAIR" || statusName === "MAINTENANCE" || statusName === "DALAM_PERBAIKAN";
				}).length;

				setPendingCounts({
					"/inspeksi/validasi": validasiAntrean,
					"/inspeksi/validasi-ulang": validasiUlangAntrean,
					"/rendal/validasi-ulang": rendalValidasiUlangAntrean,
					"/pemeliharaan/perbaikan-alat": perbaikanAntrean,
				});
			} catch (err) {
				console.error("Error checking sidebar pending badges:", err);
			}
		};

		checkPending();
	}, [pathname]);

	// --- MENU ITEMS UNTUK MASING-MASING ROLE ---
	// Setiap role punya konten sidebar sendiri yang menunjuk ke folder rutenya.
	// Isi menu masih placeholder — sesuaikan href/label saat halaman siap.
	const userRole = normalizeRole(role);

	type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };
	let mainNavItems: NavItem[] = [];

	switch (userRole) {
		case "ADMIN":
			// Administrator (akses penuh)
			mainNavItems = [
				{ name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
				{ name: "Peralatan", href: "/admin/equipment", icon: Wrench },
			];
			break;

		case "RENDAL_PEMELIHARAAN":
			// Rendal Pemeliharaan
			mainNavItems = [
				{ name: "Dashboard", href: "/rendal/dashboard", icon: LayoutDashboard },
				{ name: "Peralatan", href: "/rendal/idle", icon: Wrench },
				{ name: "Persetujuan Perbaikan", href: "/rendal/validasi-ulang", icon: CheckSquare },
				{ name: "Permintaan Scrap", href: "/rendal/scrap", icon: Trash2 },
			];
			break;

		case "PEMELIHARAAN_LAPANGAN":
			// Pemeliharaan: dashboard & perbaikan alat
			mainNavItems = [
				{
					name: "Dashboard",
					href: "/pemeliharaan/dashboard",
					icon: LayoutDashboard,
				},
				{
					name: "Perbaikan Alat",
					href: "/pemeliharaan/perbaikan-alat",
					icon: Wrench,
				},
			];
			break;

		case "INSPEKSI_TEKNIK":
			// Placeholder: Inspeksi Teknik
			mainNavItems = [
				{
					name: "Dashboard",
					href: "/inspeksi/dashboard",
					icon: LayoutDashboard,
				},
				{
					name: "Validasi Kelayakan",
					href: "/inspeksi/validasi",
					icon: Wrench,
				},
				{
					name: "Validasi Perbaikan Alat",
					href: "/inspeksi/validasi-ulang",
					icon: RefreshCw,
				},
				{
					name: "Inspeksi",
					href: "/inspeksi/inspeksi-berkala",
					icon: ClipboardCheck,
				},
			];
			break;

		case "MANAJER_RENDAL":
			// Manajer Rendal
			mainNavItems = [
				{
					name: "Dashboard",
					href: "/manajer/dashboard",
					icon: LayoutDashboard,
				},
				{
					name: "Persetujuan Validasi",
					href: "/manajer/approve",
					icon: CheckSquare,
				},
				{
					name: "Persetujuan Peminjaman",
					href: "/manajer/peminjaman",
					icon: Wrench,
				},
				{
					name: "Persetujuan Scrap",
					href: "/manajer/scrap",
					icon: Trash2,
				},
			];
			break;

		case "UNIT_KERJA_OPERASI":
		default:
			// Unit Kerja Operasi
			mainNavItems = [
				{
					name: "Dashboard",
					href: "/unit-kerja/dashboard",
					icon: LayoutDashboard,
				},
				{
					name: "Daftar Aset",
					href: "/unit-kerja/daftar-aset",
					icon: Wrench,
				},
				{
					name: "Katalog Aset",
					href: "/unit-kerja/katalog",
					icon: Cog,
				},
				{
					name: "Riwayat Permintaan",
					href: "/unit-kerja/riwayat-permintaan",
					icon: History,
				},
			];
			break;
	}

	return (
		<>
			{/* Mobile overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={closeSidebar}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed md:sticky top-0 left-0 z-50 w-64 bg-[#0A356A] text-white flex flex-col h-screen shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out print:hidden ${
					isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				}`}
			>
				<div className="p-6 flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<Image
							src="/images (2) 1.png"
							alt="Logo PUSRI"
							width={52}
							height={52}
							style={{ objectFit: "contain" }}
						/>
						<div>
							<p className="text-base text-white-300 mt-1 font-semibold">
								Asset Management
							</p>
						</div>
					</div>
					<button
						className="md:hidden text-blue-200 hover:text-white focus:outline-none"
						onClick={closeSidebar}
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				<div className="flex-1 px-4 py-2 space-y-8">
					<div>
						<ul className="space-y-1">
							{mainNavItems.map((item) => {
								const isActive =
									pathname === item.href ||
									pathname.startsWith(item.href + "/") ||
									(item.href === "/rendal/idle" &&
										pathname === "/rendal/register-equipment");
								const pendingCount = pendingCounts[item.href] || 0;

								return (
									<li key={item.name}>
										<Link
											href={item.href}
											className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
												isActive
													? "bg-blue-500/20 text-white border-l-4 border-white"
													: "text-blue-100 hover:bg-[#10488f] hover:text-white border-l-4 border-transparent"
											}`}
										>
											<div className="flex items-center gap-3">
												<item.icon className="w-4 h-4" />
												<span>{item.name}</span>
											</div>
											{pendingCount > 0 && (
												<span
													className="flex h-2.5 w-2.5 relative shrink-0"
													title={`Terdapat ${pendingCount} peralatan menunggu di antrean`}
												>
													<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
													<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
												</span>
											)}
										</Link>
									</li>
								);
							})}

							{userRole === "ADMIN" && (
								<li>
									<button
										onClick={() => setMasterDataOpen(!masterDataOpen)}
										className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
											pathname.startsWith("/admin/master")
												? "bg-blue-500/20 text-white border-l-4 border-white"
												: "text-blue-100 hover:bg-[#10488f] hover:text-white border-l-4 border-transparent"
										}`}
									>
										<span className="flex items-center gap-3">
											<Database className="w-4 h-4" />
											Master Data
										</span>
										{masterDataOpen ? (
											<ChevronDown className="w-4 h-4" />
										) : (
											<ChevronRight className="w-4 h-4" />
										)}
									</button>
									{masterDataOpen && (
										<ul className="mt-1 ml-4 space-y-1">
											{MASTER_ENTITIES.map((entity) => {
												const childActive =
													pathname === `/admin/master/${entity.slug}`;
												return (
													<li key={entity.slug}>
														<Link
															href={`/admin/master/${entity.slug}`}
															className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
																childActive
																	? "bg-blue-500/20 text-white"
																	: "text-blue-200 hover:bg-[#10488f] hover:text-white"
															}`}
														>
															{entity.label}
														</Link>
													</li>
												);
											})}
										</ul>
									)}
								</li>
							)}
						</ul>
					</div>
				</div>
			</aside>
		</>
	);
}
