"use client";

import { useEffect, useState } from "react";
import { getEquipments } from "@/action/api";
import KatalogClient from "./katalog-client";
import { normalizeEquipment } from "./shared";

type KatalogItem = ReturnType<typeof normalizeEquipment>;

export default function KatalogPage() {
  const [items, setItems] = useState<KatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const raw = (await getEquipments().catch(() => [])) as Record<
        string,
        unknown
      >[];
      const mapped = (Array.isArray(raw) ? raw : []).map(normalizeEquipment);
      if (!alive) return;
      setItems(mapped);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading)
    return (
      <main className="grid min-h-[60vh] place-items-center text-sm text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          Memuat data...
        </div>
      </main>
    );

  return <KatalogClient items={items} />;
}
