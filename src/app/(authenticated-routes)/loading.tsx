import { Loader2 } from "lucide-react";

export default function Loading() {
	return (
		<div className="page-container flex min-h-[60vh] flex-col items-center justify-center gap-3">
			<Loader2 className="h-10 w-10 animate-spin text-[#0556B3]" />
			<p className="text-sm font-medium text-gray-500">Memuat data...</p>
		</div>
	);
}
