import { useEffect, useMemo } from "react";

/**
 * Buat dan bersihkan object URL untuk daftar File sekali per perubahan array `files`
 * (bukan di dalam loop render JSX) untuk mencegah memory leak dan browser freeze.
 */
export function useFilePreviewUrls(files: File[]): string[] {
	const urls = useMemo(
		() => files.map((file) => URL.createObjectURL(file)),
		[files],
	);

	useEffect(() => {
		return () => {
			for (const url of urls) {
				URL.revokeObjectURL(url);
			}
		};
	}, [urls]);

	return urls;
}

/**
 * Format ukuran berkas otomatis ke KB (< 1 MB) atau MB (>= 1 MB).
 */
export function formatFileSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
	const mbThreshold = 1024 * 1024;
	if (bytes < mbThreshold) {
		return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	}
	return `${(bytes / mbThreshold).toFixed(2)} MB`;
}

/**
 * Kompresi gambar ringan di sisi browser agar foto beresolusi besar (mis. kamera HP)
 * tidak membebani memori atau unggahan jaringan.
 */
export async function compressImageFile(
	file: File,
	maxDimension = 1600,
	quality = 0.8,
): Promise<File> {
	if (
		typeof window === "undefined" ||
		!file.type.startsWith("image/") ||
		file.type === "image/gif" ||
		file.type === "image/svg+xml" ||
		file.size <= 512 * 1024
	) {
		return file;
	}

	let objectUrl = "";
	try {
		objectUrl = URL.createObjectURL(file);
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(new Error("Gagal memuat gambar"));
			el.src = objectUrl;
		});

		const { naturalWidth: w, naturalHeight: h } = img;
		if (!w || !h) return file;

		const scale = Math.min(1, maxDimension / Math.max(w, h));
		const targetW = Math.max(1, Math.round(w * scale));
		const targetH = Math.max(1, Math.round(h * scale));

		const canvas = document.createElement("canvas");
		canvas.width = targetW;
		canvas.height = targetH;
		const ctx = canvas.getContext("2d");
		if (!ctx) return file;

		ctx.drawImage(img, 0, 0, targetW, targetH);

		const outputType =
			file.type === "image/png" || file.type === "image/webp"
				? file.type
				: "image/jpeg";

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, outputType, quality),
		);
		if (!blob || blob.size >= file.size) return file;

		return new File([blob], file.name, {
			type: outputType,
			lastModified: file.lastModified,
		});
	} catch {
		return file;
	} finally {
		if (objectUrl) {
			URL.revokeObjectURL(objectUrl);
		}
	}
}
