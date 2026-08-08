import { getEquipments } from "@/action/api";
import KatalogClient from "./katalog-client";
import { normalizeEquipment } from "./shared";

export const metadata = { title: "Katalog Equipment Idle" };

export default async function KatalogPage() {
  const raw = (await getEquipments()) as Record<string, unknown>[];
  const items = (Array.isArray(raw) ? raw : []).map(normalizeEquipment);
  return <KatalogClient items={items} />;
}
