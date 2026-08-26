import Link from "next/link";
import { Plus, ListFilter } from "lucide-react";
import { getEquipments, getDisposals, getApprovals, getPlants } from "@/action/api";
import { buttonVariants } from "@/components/ui/button";
import RendalDashboardClient from "./rendal-dashboard-client";

export const dynamic = "force-dynamic";

export default async function RendalDashboard() {
	const [equipments, disposals, revalidations, plants] = await Promise.all([
		getEquipments().catch(() => []),
		getDisposals().catch(() => []),
		getApprovals("revalidation").catch(() => []),
		getPlants().catch(() => []),
	]);

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
