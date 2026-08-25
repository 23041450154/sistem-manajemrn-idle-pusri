import { getDisposals } from "@/action/api";
import ManajerScrapClient from "./scrap-client";

/** Server Component — fetch + sort di server, interaksi review approve/reject di client. */
export default async function ManajerScrapPage() {
	const data = await getDisposals().catch(() => []);

	const disposals = (Array.isArray(data) ? data : []).sort((a, b) => {
		const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
		const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
		if (timeB !== timeA) return timeB - timeA;
		return (Number(b.id) || 0) - (Number(a.id) || 0);
	});

	return <ManajerScrapClient disposals={disposals} />;
}
