"use client";

import KatalogDetailView from "../../../unit-kerja/katalog/[id]/katalog-detail-view";

export default function RendalDaftarEquipmentDetailPage() {
	return (
		<KatalogDetailView
			backHref="/rendal/daftar-equipment"
			backLabel="Kembali ke daftar equipment"
			canRequestReuse={false}
		/>
	);
}
