import { redirect } from "next/navigation";
import { MASTER_ENTITIES } from "@/lib/master-entities";

export default function MasterDataPage() {
	redirect(`/admin/master/${MASTER_ENTITIES[0].slug}`);
}
