"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ListFilter } from "lucide-react";
import { getEquipments, getDisposals, getApprovals, getPlants } from "@/action/api";
import { buttonVariants } from "@/components/ui/button";
import RendalDashboardClient from "./rendal-dashboard-client";

export default function RendalDashboard() {
	const [equipments, setEquipments] = useState<any[]>([]);
	const [disposals, setDisposals] = useState<any[]>([]);
	const [revalidations, setRevalidations] = useState<any[]>([]);
	const [plants, setPlants] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		void (async () => {
			const [equipments, disposals, revalidations, plants] = await Promise.all([
				getEquipments().catch(() => []),
				getDisposals().catch(() => []),
				getApprovals("revalidation").catch(() => []),
				getPlants().catch(() => []),
			]);

			if (!alive) return;
			setEquipments(Array.isArray(equipments) ? equipments : []);
			setDisposals(Array.isArray(disposals) ? disposals : []);
			setRevalidations(Array.isArray(revalidations) ? revalidations : []);
			setPlants(Array.isArray(plants) ? plants : []);
			setLoading(false);
		})();
		return () => {
			alive = false;
		};
	}, []);

	if (loading)
		return (
			<main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
					Memuat data...
				</div>
			</main>
		);

	return (
		<div className="page-container">
			{/* Header Overview */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Dashboard Operasional Rendal</h1>
					<p className="page-subtitle">
						Monitoring inventaris aset idle, distribusi fasilitas penyimpanan, dan alur pemeliharaan.
					</p>
				</div>
				<div className="header-actions">
					<Link
						href="/rendal/idle"
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<ListFilter className="w-4 h-4" />
						Daftar Aset Idle
					</Link>
					<Link
						href="/rendal/register-equipment"
						className={buttonVariants({ variant: "brand", size: "lg" })}
					>
						<Plus className="w-4 h-4" />
						Daftarkan Peralatan
					</Link>
				</div>
			</div>

			{/* Operational Dashboard Content */}
			<RendalDashboardClient
				equipments={Array.isArray(equipments) ? equipments : []}
				disposals={Array.isArray(disposals) ? disposals : []}
				revalidations={Array.isArray(revalidations) ? revalidations : []}
				plants={Array.isArray(plants) ? plants : []}
			/>
		</div>
	);
}
