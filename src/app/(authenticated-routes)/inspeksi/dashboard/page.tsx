import { getEquipments } from "@/action/api";
import InspeksiDashboardClient from "./dashboard-client";

/** Server Component — fetch + sort di server, interaksi di client. */
export default async function InspeksiDashboardPage() {
	const eqData = await getEquipments();
	const equipments = (Array.isArray(eqData) ? eqData : []).sort((a, b) => {
		const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
		const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
		if (timeB !== timeA) return timeB - timeA;
		return (Number(b.id) || 0) - (Number(a.id) || 0);
	});

	return <InspeksiDashboardClient equipments={equipments} />;
}
