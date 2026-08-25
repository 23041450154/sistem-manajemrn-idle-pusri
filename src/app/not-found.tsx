import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F9FB] p-6 text-center">
			<div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
				<FileQuestion className="h-7 w-7 text-[#0556B3]" />
			</div>
			<div>
				<h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
					404
				</h1>
				<h2 className="mt-1 text-lg font-bold text-gray-800">
					Halaman tidak ditemukan
				</h2>
				<p className="mt-1 max-w-md text-sm text-gray-500">
					Alamat yang kamu buka tidak tersedia atau sudah dipindahkan.
				</p>
			</div>
			<Link href="/" className={buttonVariants({ variant: "brand" })}>
				Kembali ke Beranda
			</Link>
		</div>
	);
}
