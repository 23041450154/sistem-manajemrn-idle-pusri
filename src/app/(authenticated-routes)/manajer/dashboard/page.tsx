import Link from "next/link";
import { CheckSquare, Trash2, ArrowUpRight } from "lucide-react";
import { getEquipments, getApprovals, getReuseRequests, getDisposals } from "@/action/api";
import { buttonVariants } from "@/components/ui/button";
import ManajerDashboardClient from "./manajer-dashboard-client";

export const dynamic = "force-dynamic";

export default async function ManajerDashboardPage() {
	const [equipments, validationApprovals, reuseRequests, disposals] = await Promise.all([
		getEquipments().catch(() => []),
		getApprovals("validation").catch(() => []),
		getReuseRequests("all").catch(() => []),
		getDisposals().catch(() => []),
	]);

	return (
		<div className="page-container">
			{/* Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Dashboard Manajer Rendal</h1>
					<p className="page-subtitle">
						Pusat persetujuan manajerial, realisasi cost avoidance, dan valuasi aset idle.
					</p>
				</div>
				<div className="header-actions">
					<Link
						href="/manajer/approve"
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<CheckSquare className="w-4 h-4" />
						Persetujuan Validasi
					</Link>
					<Link
						href="/manajer/peminjaman"
						className={buttonVariants({ variant: "brandOutline", size: "lg" })}
					>
						<ArrowUpRight className="w-4 h-4" />
						Persetujuan Peminjaman
					</Link>
					<Link
						href="/manajer/scrap"
						className={buttonVariants({ variant: "brand", size: "lg" })}
					>
						<Trash2 className="w-4 h-4" />
						Persetujuan Scrap
					</Link>
				</div>
			</div>

			{/* Manajer Executive Dashboard Content */}
			<ManajerDashboardClient
				equipments={Array.isArray(equipments) ? equipments : []}
				validationApprovals={Array.isArray(validationApprovals) ? validationApprovals : []}
				reuseRequests={Array.isArray(reuseRequests) ? reuseRequests : []}
				disposals={Array.isArray(disposals) ? disposals : []}
			/>
		</div>
	);
}
