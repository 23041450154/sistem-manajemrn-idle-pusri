"use client";

import DaftarEquipmentView from "../../unit-kerja/daftar-aset/daftar-equipment-view";

export default function RendalDaftarEquipmentPage() {
	return (
		<DaftarEquipmentView
			breadcrumbGroup="Rendal Pemeliharaan"
			breadcrumbLabel="Daftar Equipment"
			title="Daftar Equipment Idle"
			subtitle="Daftar tabel dan katalog peralatan idle yang siap digunakan maupun sedang dalam proses perbaikan."
			catalogDetailBasePath="/rendal/daftar-equipment"
			canRequestReuse={false}
		/>
	);
}
