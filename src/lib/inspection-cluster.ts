/**
 * Rumpun Inspeksi Pusri:
 * 1. INSPEKSI_1 (Inspeksi 1 / Instek 1)
 * 2. INSPEKSI_2 (Inspeksi 2 / Instek 2)
 * 3. INSPEKSI_LISTRIK (Inspeksi Listrik)
 * 4. INSPEKSI_INSTRUMEN (Inspeksi Instrumen)
 */

export const INSPECTION_CLUSTERS = [
	{ id: "INSPEKSI_1", name: "Inspeksi 1" },
	{ id: "INSPEKSI_2", name: "Inspeksi 2" },
	{ id: "INSPEKSI_LISTRIK", name: "Inspeksi Listrik" },
	{ id: "INSPEKSI_INSTRUMEN", name: "Inspeksi Instrumen" },
] as const;

export type InspectionClusterKey = (typeof INSPECTION_CLUSTERS)[number]["id"];

/**
 * Normalisasi string rumpun inspeksi agar seragam (mis. "Inspeksi 1" -> "INSPEKSI_1").
 */
export function normalizeClusterKey(val?: string | null): string {
	if (!val) return "";
	const s = String(val).trim().toUpperCase();
	if (s.includes("LISTRIK")) return "INSPEKSI_LISTRIK";
	if (s.includes("INSTRUMEN")) return "INSPEKSI_INSTRUMEN";
	if (s.includes("1") || (s.includes("I") && !s.includes("II"))) {
		if (s.includes("2") || s.includes("II")) return "INSPEKSI_2";
		return "INSPEKSI_1";
	}
	if (s.includes("2") || s.includes("II")) return "INSPEKSI_2";
	return s.replace(/\s+/g, "_");
}

/**
 * Mendeteksi rumpun inspeksi akun pengguna dari user profile (Auth context).
 */
export function getUserInspectionCluster(user?: any): string | null {
	if (!user) return null;

	// 1. Cek field khusus inspection_category / inspection_cluster jika ada
	const directCategory =
		user.inspection_category ||
		user.inspectionCategory ||
		user.inspection_cluster ||
		user.inspectionCluster;
	if (directCategory) {
		const norm = normalizeClusterKey(directCategory);
		if (norm) return norm;
	}

	// 2. Cek NPP seeder akun inspeksi khusus Pusri
	const npp = String(user.npp || user.contact_npp || user.contactNpp || "").trim();
	if (npp === "100007") return "INSPEKSI_1";
	if (npp === "100008") return "INSPEKSI_2";
	if (npp === "100009") return "INSPEKSI_LISTRIK";
	if (npp === "100010") return "INSPEKSI_INSTRUMEN";

	// 3. Cek user.name
	const name = String(user.name || "").toUpperCase();
	if (name.includes("LISTRIK")) return "INSPEKSI_LISTRIK";
	if (name.includes("INSTRUMEN")) return "INSPEKSI_INSTRUMEN";
	if (name.includes("INSPEKSI 1") || name.includes("INSTEK 1") || name === "INSPEKSI 1") return "INSPEKSI_1";
	if (name.includes("INSPEKSI 2") || name.includes("INSTEK 2") || name === "INSPEKSI 2") return "INSPEKSI_2";

	// 4. Cek user.role / roleName jika spesifik
	const role = String(user.role || user.roleName || user.role_name || "").toUpperCase();
	if (role.includes("LISTRIK")) return "INSPEKSI_LISTRIK";
	if (role.includes("INSTRUMEN")) return "INSPEKSI_INSTRUMEN";
	if (role.includes("INSPEKSI_1") || role.includes("INSTEK_1")) return "INSPEKSI_1";
	if (role.includes("INSPEKSI_2") || role.includes("INSTEK_2")) return "INSPEKSI_2";

	return null;
}

/**
 * Mendapatkan nama label tampilan rumpun inspeksi (misal: "Inspeksi 1", "Inspeksi Listrik").
 */
export function getInspectionClusterName(clusterKeyOrUser?: any): string {
	if (!clusterKeyOrUser) return "Inspeksi";

	let clusterKey: string | null = null;
	if (typeof clusterKeyOrUser === "string") {
		clusterKey = normalizeClusterKey(clusterKeyOrUser);
	} else if (typeof clusterKeyOrUser === "object") {
		clusterKey = getUserInspectionCluster(clusterKeyOrUser);
		if (!clusterKey && clusterKeyOrUser.roleName) {
			return clusterKeyOrUser.roleName;
		}
	}

	switch (clusterKey) {
		case "INSPEKSI_1":
			return "Inspeksi 1";
		case "INSPEKSI_2":
			return "Inspeksi 2";
		case "INSPEKSI_LISTRIK":
			return "Inspeksi Listrik";
		case "INSPEKSI_INSTRUMEN":
			return "Inspeksi Instrumen";
		default:
			return "Inspeksi";
	}
}

/**
 * Mengambil rumpun inspeksi dari data peralatan (equipment).
 */
export function getEquipmentInspectionCluster(equipment?: any): string | null {
	if (!equipment) return null;
	const val =
		equipment.inspection_cluster ||
		equipment.inspection_purpose ||
		equipment.tujuan_inspeksi ||
		equipment.inspectionCluster ||
		equipment.inspectionPurpose ||
		equipment.cluster;
	if (!val) return null;
	return normalizeClusterKey(val);
}
