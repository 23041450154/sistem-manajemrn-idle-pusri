"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, PackageSearch, SlidersHorizontal } from "lucide-react";
import type { KatalogItem } from "./types";
import { STATE_STYLE, EquipmentThumb, formatRupiah } from "./shared";

const ALL = "Semua";

export default function KatalogClient({
  items,
  embedded = false,
}: {
  items: KatalogItem[];
  embedded?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [plant, setPlant] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [condition, setCondition] = useState(ALL);

  const plants = useMemo(() => uniq(items.map((i) => i.plant)), [items]);
  const categories = useMemo(() => uniq(items.map((i) => i.objectType)), [items]);
  const conditions = useMemo(() => uniq(items.map((i) => i.condition)), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (plant !== ALL && i.plant !== plant) return false;
      if (category !== ALL && i.objectType !== category) return false;
      if (condition !== ALL && i.condition !== condition) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        (i.storageLocation ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, plant, category, condition]);

  return (
    <div className={embedded ? "p-4 sm:p-5" : "mx-auto max-w-[1400px] px-6 py-6"}>
      {!embedded && (
        <header className="border-b border-[#E6E8EA] pb-5">
          <p className="text-[12px] font-medium text-[#64748B]">Unit Kerja Operasi</p>
          <h1 className="mt-1 text-[20px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            Katalog Equipment Idle
          </h1>
          <p className="mt-1 text-[14px] text-[#64748B]">
            Aset idle yang tersedia untuk dipinjam unit kerja. Pilih satu untuk melihat spesifikasi
            lengkap dan mengajukan permintaan.
          </p>
        </header>
      )}

      <div className={`${embedded ? "" : "mt-5 "}flex flex-col gap-3 lg:flex-row lg:items-center`}>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, kode, atau lokasi penyimpanan"
            aria-label="Cari equipment"
            className="h-11 w-full rounded-[4px] border border-[#E6E8EA] bg-white pr-3 pl-9 text-[14px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#334155] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#64748B]" aria-hidden />
          <Select label="Plant" value={plant} onChange={setPlant} options={plants} />
          <Select label="Kategori" value={category} onChange={setCategory} options={categories} />
          <Select label="Kondisi" value={condition} onChange={setCondition} options={conditions} />
        </div>
      </div>

      <p className="mt-4 text-[12px] font-medium text-[#64748B]" aria-live="polite">
        {visible.length} dari {items.length} equipment
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 border border-[#E6E8EA] bg-white px-6 py-16 text-center">
          <PackageSearch className="h-8 w-8 text-[#64748B]" aria-hidden />
          <p className="text-[14px] text-[#0F172A]">
            Tidak ada equipment yang cocok dengan filter ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPlant(ALL);
              setCategory(ALL);
              setCondition(ALL);
            }}
            className="h-11 rounded-[4px] border border-[#E6E8EA] px-4 text-[14px] font-medium text-[#334155] transition-colors duration-140 hover:bg-[#F2F3F4] focus:ring-2 focus:ring-[#334155] focus:ring-offset-1 focus:outline-none"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <li key={item.id}>
              <EquipmentCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EquipmentCard({ item }: { item: KatalogItem }) {
  const state = STATE_STYLE[item.state];
  return (
    <Link
      href={`/unit-kerja/katalog/${item.id}`}
      className="group flex h-full flex-col border border-[#E6E8EA] bg-white transition-colors duration-140 hover:bg-[#F2F3F4] focus-visible:ring-2 focus-visible:ring-[#334155] focus-visible:ring-offset-1 focus-visible:outline-none"
    >
      <EquipmentThumb
        src={item.imageUrl}
        alt={item.name}
        className="aspect-[4/3] w-full border-b border-[#E6E8EA]"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[12px] text-[#64748B]">{item.code}</span>
          <span
            className={`shrink-0 rounded-[2px] border px-1.5 py-0.5 text-[11px] font-semibold ${state.badge}`}
          >
            {state.label}
          </span>
        </div>
        <h2 className="line-clamp-2 text-[14px] leading-[1.35] font-semibold text-[#0F172A]">
          {item.name}
        </h2>
        <dl className="mt-auto space-y-1 text-[12px] text-[#64748B]">
          <div className="flex justify-between gap-2">
            <dt>Plant</dt>
            <dd className="truncate text-right text-[#0F172A]">{item.plant}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Kategori</dt>
            <dd className="truncate text-right text-[#0F172A]">{item.objectType}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Kondisi</dt>
            <dd className="truncate text-right text-[#0F172A]">{item.condition}</dd>
          </div>
        </dl>
        <p className="border-t border-[#E6E8EA] pt-2 text-[12px] text-[#64748B]">
          Estimasi nilai guna ulang{" "}
          <span className="font-semibold text-[#059669] tabular-nums">
            {formatRupiah(item.estimatedReuseValue)}
          </span>
        </p>
      </div>
    </Link>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-[4px] border border-[#E6E8EA] bg-white px-3 focus-within:ring-2 focus-within:ring-[#334155] focus-within:ring-offset-1">
      <span className="text-[12px] font-medium text-[#64748B]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[13px] text-[#0F172A] focus:outline-none"
      >
        {[ALL, ...options].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function uniq(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort();
}
