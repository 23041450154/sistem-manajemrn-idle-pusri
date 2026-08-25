import Link from "next/link";
import {
  Wrench,
  Database,
  Trash2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Layers,
  FileText,
} from "lucide-react";
import {
  getEquipments,
  getObjectTypes,
  getStorageLocations,
  getDisposals,
} from "@/action/api";

const MODULES = [
  {
    href: "/admin/equipment",
    icon: Wrench,
    title: "Manajemen Peralatan",
    desc: "Kelola inventarisasi & status aset",
  },
  {
    href: "/admin/master",
    icon: Database,
    title: "Master Data Referensi",
    desc: "ObjectType, StorageLocation, RequireAction",
  },
  {
    href: "/manajer/scrap",
    icon: Trash2,
    title: "Persetujuan Scrap",
    desc: "Antrean usulan penghapusan aset",
  },
  {
    href: "/manajer/approve",
    icon: ShieldCheck,
    title: "Persetujuan Validasi",
    desc: "Verifikasi kelayakan aset idle",
  },
];

/** Server Component penuh — tidak ada interaktivitas, data di-fetch di server. */
export default async function AdminDashboardPage() {
  const [eqList, objTypes, storageLocs, disposals] = await Promise.all([
    getEquipments(),
    getObjectTypes(),
    getStorageLocations(),
    getDisposals(),
  ]);

  const stats = {
    totalEquipment: eqList.length,
    totalCategories: objTypes.length,
    totalStorage: storageLocs.length,
    totalDisposals: disposals.length,
  };

  type RecentEquipment = {
    id?: number | string;
    name?: string | { name?: string };
    plant?: string | { name?: string; description?: string };
    status?: string | { name?: string };
    equipment_code?: string;
  };
  const recentEquipments = (eqList || []).slice(0, 5) as RecentEquipment[];

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const kpis = [
    {
      label: "Total Aset Inventaris",
      value: stats.totalEquipment,
      icon: Wrench,
      caption: "Peralatan aktif & idle terdaftar",
    },
    {
      label: "Kategori (ObjectType)",
      value: stats.totalCategories,
      icon: Layers,
      caption: "Klasifikasi tipe mesin & alat",
    },
    {
      label: "Gudang & Penyimpanan",
      value: stats.totalStorage,
      icon: MapPin,
      caption: "Lokasi penyimpanan fisik",
    },
    {
      label: "Persetujuan Disposal",
      value: stats.totalDisposals,
      icon: Trash2,
      caption: "Usulan pembuangan aset",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="bg-[#0A356A] rounded-2xl px-6 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Dashboard Administrator
          </h1>
          <p className="text-blue-200/90 text-xs mt-1 font-medium capitalize">
            {today}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/equipment"
            className="bg-white text-[#0A356A] hover:bg-blue-50 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Kelola Peralatan
          </Link>
          <Link
            href="/admin/master"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Master Data
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, caption }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {label}
              </span>
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#0A356A] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              {caption}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid: Modules + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Access Modules */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-[#0A356A] hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0A356A] flex items-center justify-center mb-3 group-hover:bg-[#0A356A] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                  {desc}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A356A] mt-4 pt-3 border-t border-slate-100">
                <span>Buka Modul</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Equipment */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0A356A]" />
              Peralatan Terbaru
            </h3>
            <Link
              href="/admin/equipment"
              className="text-[11px] font-bold text-[#0A356A] hover:underline flex items-center gap-1"
            >
              Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentEquipments.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-slate-400">
                Belum ada data peralatan.
              </div>
            ) : (
              recentEquipments.map((item, idx) => {
                const nameStr =
                  typeof item.name === "string"
                    ? item.name
                    : item.name?.name || "-";
                const plantStr =
                  typeof item.plant === "string"
                    ? item.plant
                    : item.plant?.name || item.plant?.description || "-";
                const statusStr =
                  typeof item.status === "string"
                    ? item.status
                    : item.status?.name || "REGISTERED";
                return (
                  <div
                    key={item.id || idx}
                    className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {nameStr}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.equipment_code || "-"} · {plantStr}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {statusStr}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
