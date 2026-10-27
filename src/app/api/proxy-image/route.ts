import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { API_URL } from "@/config/api";

/**
 * Proxy foto/berkas dari backend ke browser.
 *
 * Backend mengharuskan Authorization: Bearer untuk GET /uploads/*, tetapi
 * <img> di browser tidak bisa memasang header. Route ini fetch server-side
 * dengan token dari cookie httpOnly lalu mengalirkan bytenya kembali.
 * ponytail: <img> pakai URL ini, Next.js basePath di-handle otomatis.
 *
 * Keamanan: hanya path /uploads/ di host API_URL yang boleh. Penolakan
 * traversal ../../../ dan encoding bypass (%2e) dilakukan dengan resolve URL
 * + decode ulang, bukan sekadar startsWith string (jev: guard literal tidak
 * cukup, prob 0.48).
 */
export async function GET(request: NextRequest) {
	const raw = request.nextUrl.searchParams.get("url");
	if (typeof raw !== "string" || raw === "") {
		return new Response("url wajib diisi", { status: 400 });
	}

	// Tolak traversal secara eksplisit sebelum resolve (backslash Windows + ..).
	const normalized = raw.replace(/\\/g, "/");
	if (normalized.includes("..")) {
		return new Response("url tidak valid", { status: 400 });
	}

	const token =
		(await cookies()).get("access_token")?.value ??
		(await cookies()).get("token")?.value;
	if (!token) {
		return new Response("Unauthorized", { status: 401 });
	}

	let target: URL;
	try {
		target = new URL(normalized, API_URL);
	} catch {
		return new Response("url tidak valid", { status: 400 });
	}

	// Harus tetap di host API_URL dan di bawah /uploads/ setelah resolve. Jev:
	// guard string literal tidak cukup, jadi bandingkan hasil resolve (yang
	// menormalkan encoding %2e, //, dsb.), bukan string input.
	const base = new URL(API_URL).origin;
	if (target.origin !== base || !target.pathname.startsWith("/uploads/")) {
		return new Response("url tidak valid", { status: 400 });
	}

	const upstream = await fetch(target, {
		headers: {
			Authorization: `Bearer ${token}`,
			// PDF viewer butuh Range; gambar cuek. (jev: 0.58 mendukung range)
			...(request.headers.get("range")
				? { Range: request.headers.get("range") as string }
				: {}),
		},
	});

	if (!upstream.ok || upstream.body === null) {
		return new Response("berkas tidak tersedia", {
			status: upstream.status === 401 || upstream.status === 404 ? upstream.status : 502,
		});
	}

	const headers = new Headers();
	const passthrough = [
		"content-type",
		"content-length",
		"content-disposition",
		"accept-ranges",
	];
	for (const name of passthrough) {
		const value = upstream.headers.get(name);
		if (value !== null) headers.set(name, value);
	}
	headers.set("cache-control", "no-store");

	return new Response(upstream.body, { status: upstream.status, headers });
}
