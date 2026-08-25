import { notFound } from "next/navigation";
import { MasterDataTable } from "@/components/MasterDataTable";
import { MASTER_ENTITIES, findMasterEntity } from "@/lib/master-entities";

export function generateStaticParams() {
	return MASTER_ENTITIES.filter((e) => !e.hidden).map((e) => ({ slug: e.slug }));
}

export default async function MasterEntityPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const entity = findMasterEntity(slug);
	if (!entity || entity.hidden) notFound();

	return <MasterDataTable entity={entity} />;
}
