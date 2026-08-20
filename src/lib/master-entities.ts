/**
 * Satu sumber definisi master data referensi.
 * Slug dipakai sebagai segmen route (/admin/master/<slug>) dan kunci endpoint backend.
 */

export type MasterEntity = {
	slug: string;
	label: string;
	/** Sembunyikan dari navigasi sampai endpoint backend siap. */
	hidden?: boolean;
	/** GET publik (list) */
	listPath: string;
	/** Basis CRUD admin. null = backend belum menyediakan tulis (read-only). */
	adminPath: string | null;
	/** Kolom nama pada payload backend. */
	nameField: "name" | "reason_name";
	/** Butuh relasi plant (storage location). */
	needsPlant?: boolean;
	placeholder: string;
};

export const MASTER_ENTITIES: MasterEntity[] = [
	{
		slug: "object-type",
		label: "Object Type",
		listPath: "/api/object-types",
		adminPath: "/api/admin/object-type",
		nameField: "name",
		placeholder: "Contoh: Valve, Rotating Equipment",
	},
	{
		slug: "condition",
		label: "Condition",
		listPath: "/api/condition",
		adminPath: "/api/admin/condition",
		nameField: "name",
		placeholder: "Contoh: Baik, Rusak Ringan",
	},
	{
		slug: "storage-location",
		label: "Storage Location",
		listPath: "/api/storage-locations",
		adminPath: "/api/admin/storage-location",
		nameField: "name",
		needsPlant: true,
		placeholder: "Contoh: Gudang Pemeliharaan Sentral",
	},
	{
		slug: "status",
		label: "Status",
		listPath: "/api/status",
		adminPath: "/api/admin/status",
		nameField: "name",
		placeholder: "Contoh: Idle, Ready To Use",
	},
	{
		slug: "disposal-method",
		label: "Disposal Method",
		listPath: "/api/disposal-method",
		adminPath: "/api/admin/disposal-method",
		nameField: "name",
		placeholder: "Contoh: Lelang, Scrap",
	},
	{
		// ponytail: read-only karena backend hanya expose GET /api/plants.
		// Tambah CRUD di sini begitu route admin/plant tersedia.
		slug: "plant",
		label: "Plant",
		listPath: "/api/plants",
		adminPath: null,
		nameField: "name",
		placeholder: "Contoh: PUSRI-IB",
	},
	{
		slug: "required-action",
		label: "Required Action",
		listPath: "/api/require-action",
		adminPath: "/api/admin/require-action",
		nameField: "name",
		placeholder: "Contoh: Perlu Overhaul Total",
	},
	{
		slug: "idle-reason",
		label: "Idle Reason",
		hidden: true,
		listPath: "/api/idle-reason",
		adminPath: "/api/admin/idle-reason",
		nameField: "reason_name",
		placeholder: "Contoh: Tidak Digunakan",
	},
	{
		slug: "area",
		label: "Area",
		hidden: true,
		listPath: "/api/areas",
		adminPath: "/api/admin/area",
		nameField: "name",
		placeholder: "Contoh: Area Pabrik Utama",
	},
	{
		slug: "functional-location",
		label: "Functional Location",
		hidden: true,
		listPath: "/api/functional-locations",
		adminPath: "/api/admin/functional-location",
		nameField: "name",
		placeholder: "Contoh: P-III/AREA-01",
	},
];

export function findMasterEntity(slug: string): MasterEntity | undefined {
	return MASTER_ENTITIES.find((e) => e.slug === slug);
}
