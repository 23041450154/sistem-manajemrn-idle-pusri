"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/**
 * Error boundary untuk seluruh area login (semua role).
 * Wajib "use client" sesuai konvensi error.tsx Next.js.
 */
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Unhandled route error:", error);
	}, [error]);

	return (
		<div className="page-container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
				<AlertCircle className="h-6 w-6 text-red-500" />
			</div>
			<div>
				<h2 className="text-lg font-bold text-gray-900">
					Terjadi kesalahan pada halaman ini
				</h2>
				<p className="mt-1 max-w-md text-sm text-gray-500">
					Data mungkin gagal dimuat dari server. Coba muat ulang; kalau berulang,
					hubungi administrator.
				</p>
				{error.digest && (
					<p className="mt-2 text-xs text-gray-400">Kode error: {error.digest}</p>
				)}
			</div>
			<button
				type="button"
				onClick={reset}
				className={buttonVariants({ variant: "brand" })}
			>
				<RefreshCw className="h-4 w-4" />
				Coba Lagi
			</button>
		</div>
	);
}
