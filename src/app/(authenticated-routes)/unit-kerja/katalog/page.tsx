"use client";

import { useEffect, useState } from "react";
import { getEquipments, getReuseRequests } from "@/action/api";
import { statusName } from "@/lib/equipment-status";
import KatalogClient from "./katalog-client";
import { normalizeEquipment } from "./shared";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

type KatalogItem = ReturnType<typeof normalizeEquipment>;

/** Unit Kerja hanya melihat aset siap pakai + yang sedang diperbaiki. */
const VISIBLE_STATUSES = ["READY_TO_USE", "REPAIR"];

export default function KatalogPage() {
  const [items, setItems] = useState<KatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [rawEqList, rawReuseRequests] = await Promise.all([
        getEquipments().catch(() => []),
        getReuseRequests().catch(() => []),
      ]);

      const requestedEqIdSet = new Set<string>();
      if (Array.isArray(rawReuseRequests)) {
        rawReuseRequests.forEach((req: any) => {
          if (req.equipment_id) requestedEqIdSet.add(String(req.equipment_id));
          if (req.equipmentId) requestedEqIdSet.add(String(req.equipmentId));
          if (req.equipment?.id) requestedEqIdSet.add(String(req.equipment.id));
          if (req.equipment_code)
            requestedEqIdSet.add(String(req.equipment_code).trim().toLowerCase());
          if (req.equipmentCode)
            requestedEqIdSet.add(String(req.equipmentCode).trim().toLowerCase());
          if (req.equipment?.equipment_code)
            requestedEqIdSet.add(
              String(req.equipment.equipment_code).trim().toLowerCase(),
            );
        });
      }

      const filtered = (Array.isArray(rawEqList) ? rawEqList : []).filter(
        (item: any) => {
          const isVisible = VISIBLE_STATUSES.includes(
            statusName(
              typeof item.status === "object" ? item.status?.name : item.status,
            ),
          );
          if (!isVisible) return false;

          const itemId = String(item.id);
          const itemCode = String(item.equipment_code || item.kodeAlat || "")
            .trim()
            .toLowerCase();
          // Sembunyikan equipment yang sudah diajukan permintaan
          if (
            requestedEqIdSet.has(itemId) ||
            (itemCode && requestedEqIdSet.has(itemCode))
          ) {
            return false;
          }
          return true;
        },
      );

      const mapped = filtered.map((item: any) =>
        normalizeEquipment(item as Record<string, unknown>),
      );

      mapped.sort((a, b) => {
        const priorityA = a.state === "ready" ? 0 : 1;
        const priorityB = b.state === "ready" ? 0 : 1;
        if (priorityA !== priorityB) return priorityA - priorityB;

        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

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
