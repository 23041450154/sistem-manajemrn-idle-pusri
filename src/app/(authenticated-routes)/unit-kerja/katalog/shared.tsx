import { Boxes } from "lucide-react";
import type { EquipmentState, KatalogDetail } from "./types";

/* DESIGN.md status hues — five workflow states, no sixth.
   Tailwind class, not inline style, so the token stays the single source. */
export const STATE_STYLE: Record<
  EquipmentState,
  { label: string; badge: string }
> = {
  registered: {
    label: "Menunggu validasi",
    badge: "bg-[#E0F2FE] text-[#0284C7]",
  },
  repair: { label: "Dalam perbaikan", badge: "bg-[#FEF3C7] text-[#B45309]" },
  ready: { label: "Siap dipakai ulang", badge: "bg-[#DCFCE7] text-[#16A34A]" },
  rejected: { label: "Tidak layak", badge: "bg-[#FEE2E2] text-[#DC2626]" },
  disposal: { label: "Disposal", badge: "bg-[#FEF3C7] text-[#B45309]" },
};

export function formatRupiah(value?: number) {
  if (value == null || Number.isNaN(value)) return "Belum dinilai";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function toState(status?: string, condition?: string): EquipmentState {
  const s = `${status ?? ""} ${condition ?? ""}`.toUpperCase();
  if (s.includes("DISPOSAL")) return "disposal";
  if (s.includes("REJECT") || s.includes("TIDAK LAYAK")) return "rejected";
  if (s.includes("REPAIR") || s.includes("PERBAIKAN")) return "repair";
  if (s.includes("READY") || s.includes("VALIDATED") || s.includes("APPROVED"))
    return "ready";
  return "registered";
}

function pickImages(raw: Record<string, unknown>): string[] {
  const list = Array.isArray(raw.attachments) ? raw.attachments : [];
  return list
    .map((a) => {
      const att = a as Record<string, unknown>;
      return (att.file_url ?? att.fileUrl ?? att.url ?? "") as string;
    })
    .filter((url) => /\.(png|jpe?g|webp|gif|avif)$/i.test(url));
}

function num(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: unknown): string | undefined {
  const s = typeof value === "string" ? value.trim() : "";
  return s || undefined;
}

/** Backend preloads relations as objects (`plant.name`), older payloads sent flat strings. */
function relName(value: unknown): string | undefined {
  if (typeof value === "string") return str(value);
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return str(o.name) ?? str(o.description);
  }
  return undefined;
}

export function normalizeEquipment(
  raw: Record<string, unknown>,
): KatalogDetail {
  const status = relName(raw.status) ?? str(raw.status_name);
  const condition = relName(raw.condition) ?? str(raw.condition_name);
  const storage = raw.storage_location as
    | Record<string, unknown>
    | string
    | undefined;
  const plant =
    relName(raw.plant) ??
    (storage && typeof storage === "object"
      ? relName(storage.plant)
      : undefined) ??
    str(raw.plant_description);
  const images = pickImages(raw);

  return {
    id: String(raw.id ?? ""),
    code: str(raw.equipment_code) ?? "—",
    name: str(raw.name) ?? "Tanpa nama",
    plant: plant ?? "—",
    plantDescription:
      typeof raw.plant === "object" && raw.plant
        ? str((raw.plant as Record<string, unknown>).description)
        : str(raw.plant_description),
    objectType: relName(raw.object_type) ?? str(raw.object_type_name) ?? "—",
    condition: condition ?? "Belum dinilai",
    statusLabel: status ?? "—",
    state: toState(status, condition),
    storageLocation: relName(storage),
    funcLoc: relName(raw.func_loc),
    idleReason: str(raw.idle_reason),
    idleSince: str(raw.idle_since),
    vendor: str(raw.vendor),
    year: num(raw.year),
    notes: str(raw.notes),
    bookValue: num(raw.book_value),
    originalValue: num(raw.original_value),
    estimatedReuseValue: num(raw.estimated_reuse_value),
    imageUrl: images[0],
    images,
  };
}

/** Equipment photo, or a neutral placeholder when the asset has no upload yet. */
export function EquipmentThumb({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-[#F2F3F4] ${className}`}
        role="img"
        aria-label={`${alt} — belum ada foto`}
      >
        <Boxes className="h-8 w-8 text-[#64748B]" aria-hidden />
      </div>
    );
  }
  /* fill + wrapper: dimensi ditentukan className pemanggil (aspect-/w-/h-),
     sama seperti perilaku <img> lama. Host diizinkan via images.remotePatterns. */
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image optimizer gagal utk foto /uploads backend */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
    </span>
  );
}
