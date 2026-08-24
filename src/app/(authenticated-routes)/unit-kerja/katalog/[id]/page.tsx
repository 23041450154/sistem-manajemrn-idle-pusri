import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Factory, Wrench } from "lucide-react";
import { getEquipmentById } from "@/action/api";
import { normalizeEquipment, STATE_STYLE, formatRupiah } from "../shared";
import Gallery from "./gallery";
import RequestModalButton from "./request-modal-button";

export default async function KatalogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = (await getEquipmentById(id)) as Record<string, unknown> | null;
  if (!raw || !raw.id) notFound();

  const eq = normalizeEquipment(raw);
  const state = STATE_STYLE[eq.state];

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <Link
        href="/unit-kerja/katalog"
        className="inline-flex h-11 items-center gap-2 text-[13px] font-medium text-[#334155] transition-colors duration-140 hover:text-[#0A356A] focus-visible:ring-2 focus-visible:ring-[#334155] focus-visible:ring-offset-1 focus-visible:outline-none"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali ke katalog
      </Link>

      <header className="border-b border-[#E6E8EA] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] text-[#64748B]">{eq.code}</p>
            <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.01em] text-[#0F172A]">
              {eq.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <Factory className="h-3.5 w-3.5" aria-hidden />
                {eq.plant}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {eq.storageLocation ?? "Lokasi belum dicatat"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" aria-hidden />
                {eq.objectType}
              </span>
            </p>
          </div>
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${state.badge}`}
          >
            {state.label}
          </span>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Gallery images={eq.images} name={eq.name} />

        <div className="flex flex-col gap-4">
          <section className="border border-[#E6E8EA] bg-white p-5">
            <h2 className="text-[14px] font-semibold text-[#0F172A]">Nilai aset</h2>
            <dl className="mt-3 divide-y divide-[#E6E8EA]">
              <Row label="Estimasi nilai guna ulang" value={formatRupiah(eq.estimatedReuseValue)} accent />
              <Row label="Nilai buku" value={formatRupiah(eq.bookValue)} />
              <Row label="Nilai perolehan" value={formatRupiah(eq.originalValue)} />
            </dl>
          </section>

          <section className="border border-[#E6E8EA] bg-white p-5">
            <h2 className="text-[14px] font-semibold text-[#0F172A]">Spesifikasi</h2>
            <dl className="mt-3 divide-y divide-[#E6E8EA]">
              <Row label="Kondisi" value={eq.condition} />
              <Row label="Status" value={eq.statusLabel} />
              <Row label="Vendor" value={eq.vendor ?? "Tidak dicatat"} />
              <Row label="Tahun" value={eq.year ? String(eq.year) : "Tidak dicatat"} />
              <Row label="Functional location" value={eq.funcLoc ?? "Tidak dicatat"} />
              <Row label="Alasan idle" value={eq.idleReason ?? "Tidak dicatat"} />
            </dl>
          </section>

          {eq.notes && (
            <section className="border border-[#E6E8EA] bg-white p-5">
              <h2 className="text-[14px] font-semibold text-[#0F172A]">Catatan</h2>
              <p className="mt-2 max-w-[70ch] text-[14px] leading-[1.5] text-[#334155]">
                {eq.notes}
              </p>
            </section>
          )}

          <RequestModalButton eq={eq} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[12px] font-medium text-[#64748B]">{label}</dt>
      <dd
        className={`text-right text-[14px] tabular-nums ${
          accent ? "font-semibold text-[#059669]" : "text-[#0F172A]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
