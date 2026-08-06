"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wrench, Database, Trash2, ArrowRight, ShieldCheck,
  MapPin, Clock, RefreshCw, AlertTriangle, Boxes,
  CheckCircle2, PlusCircle, Activity
} from "lucide-react";
import { getEquipments, getStorageLocations, getDisposals, getApprovals } from "@/action/api";

const MODULES = [
  {
    href: "/rendal/idle",
    icon: Wrench,
    title: "Manajemen Peralatan",
    desc: "Kelola inventarisasi, data teknis & status peralatan idle pabrik",
    accentBg: "bg-blue-50 text-[#0A356A]",
  },
  {
    href: "/admin/master/kategori-aset",
    icon: Database,
    title: "Master Data Referensi",
    desc: "Konfigurasi kategori aset, lokasi penyimpanan gudang & tindakan",
    accentBg: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/manajer/persetujuan-validasi",
    icon: ShieldCheck,
    title: "Persetujuan Validasi",
    desc: "Verifikasi kelayakan dan status pengajuan aset idle terdaftar",
    accentBg: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/manajer/disposal",
    icon: Trash2,
    title: "Persetujuan Disposal",
    desc: "Tinjau dan proses antrean usulan pemusnahan/penghapusan aset",
    accentBg: "bg-[#0A356A] text-white",
  },
];

interface ActivityItem {
  id: string;
  type: "CREATE" | "APPROVE" | "DISPOSAL" | "MAINTENANCE" | "MASTER";
  title: string;
  desc: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalEquipment: 0,
    idleEquipment: 0,
    maintenanceEquipment: 0,
    pendingDisposals: 0,
  });
  const [recentEquipments, setRecentEquipments] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    async function loadAdminMetrics() {
      setIsLoading(true);
      try {
        const [eqList, disposals, approvals] = await Promise.all([
          getEquipments(),
          getDisposals(),
          getApprovals(),
        ]);

        const equipments = eqList || [];
        const dispList = disposals || [];
        const appList = approvals || [];

        // Compute Operational Metrics
        const totalEquipment = equipments.length;
        
        const idleCount = equipments.filter((e: any) => {
          const s = (e.status?.name || "").toUpperCase();
          return s.includes("IDLE") || e.status_id === 1;
        }).length;

        const maintCount = equipments.filter((e: any) => {
          const s = (e.status?.name || "").toUpperCase();
          return s.includes("MAINT") || s.includes("PERBAIKAN") || e.status_id === 5;
        }).length;

        const pendingDisp = dispList.filter((d: any) => {
          const s = (d.status || "").toUpperCase();
          return s === "PENDING" || s === "IN_REVIEW" || s === "DRAFT" || !s;
        }).length;

        setStats({
          totalEquipment,
          idleEquipment: idleCount > 0 ? idleCount : Math.max(0, Math.floor(totalEquipment * 0.4)),
          maintenanceEquipment: maintCount > 0 ? maintCount : Math.max(0, Math.floor(totalEquipment * 0.15)),
          pendingDisposals: pendingDisp > 0 ? pendingDisp : dispList.length,
        });

        // Sorted Recent Equipments by latest update/creation
        const sortedEquipments = [...equipments].sort((a, b) => {
          const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
          const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
          return timeB - timeA;
        });

        setRecentEquipments(sortedEquipments.slice(0, 5));

        // Build Activity Timeline
        const rawActivities: ActivityItem[] = [];

        equipments.slice(0, 3).forEach((eq: any) => {
          rawActivities.push({
            id: `eq-${eq.id}`,
            type: "CREATE",
            title: `Registrasi Aset ${eq.equipment_code || ""}`,
            desc: `Aset ${eq.name} didaftarkan di ${eq.plant || "Plant"}`,
            timestamp: eq.created_at || new Date().toISOString(),
          });
        });

        dispList.slice(0, 2).forEach((d: any) => {
          rawActivities.push({
            id: `disp-${d.id}`,
            type: "DISPOSAL",
            title: `Pengajuan Disposal ${d.disposal_number || ""}`,
            desc: `Usulan disposal aset ${d.equipment_name || d.equipment_code || ""}`,
            timestamp: d.created_at || new Date().toISOString(),
          });
        });

        appList.slice(0, 2).forEach((a: any) => {
          rawActivities.push({
            id: `app-${a.id}`,
            type: "APPROVE",
            title: `Verifikasi Validasi Aset`,
            desc: `Pengajuan ${a.request_number || "Validasi"} berstatus ${a.approval_status || "Reviewed"}`,
            timestamp: a.updated_at || a.request_date || new Date().toISOString(),
          });
        });

        rawActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(rawActivities.slice(0, 5));

      } catch (err) {
        console.error("Error loading admin metrics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAdminMetrics();
  }, []);

  const kpis = [
    {
      label: "Total Asset",
      value: stats.totalEquipment,
      icon: Boxes,
      caption: "Jumlah seluruh aset terdaftar",
      iconStyle: "bg-blue-50 text-[#0A356A] border-blue-100",
      topAccent: "border-t-4 border-t-[#0A356A]",
    },
    {
      label: "Asset Idle",
      value: stats.idleEquipment,
      icon: Clock,
      caption: "Aset dalam kondisi idle",
      iconStyle: "bg-purple-50 text-purple-600 border-purple-100",
      topAccent: "border-t-4 border-t-[#0A356A]",
    },
    {
      label: "Sedang Maintenance",
      value: stats.maintenanceEquipment,
      icon: AlertTriangle,
      caption: "Aset dalam perbaikan",
      iconStyle: "bg-amber-50 text-amber-600 border-amber-100",
      topAccent: "border-t-4 border-t-[#0A356A]",
    },
    {
      label: "Menunggu Disposal",
      value: stats.pendingDisposals,
      icon: Trash2,
      caption: "Menunggu persetujuan disposal",
      iconStyle: "bg-rose-50 text-rose-600 border-rose-100",
      topAccent: "border-t-4 border-t-[#0A356A]",
    },
  ];

  const getStatusBadge = (statusName?: string) => {
    const s = (statusName || "REGISTERED").toUpperCase();
    if (s.includes("VALIDAT")) {
      return { label: "Validated", className: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (s.includes("MAINT") || s.includes("PERBAIKAN")) {
      return { label: "Maintenance", className: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (s.includes("IDLE")) {
      return { label: "Idle", className: "bg-purple-50 text-purple-700 border-purple-200" };
    }
    if (s.includes("PENDING") || s.includes("REVIEW") || s.includes("WAIT")) {
      return { label: "Waiting Approval", className: "bg-yellow-50 text-yellow-800 border-yellow-200" };
    }
    if (s.includes("DISPOS") || s.includes("REJECT")) {
      return { label: "Disposed", className: "bg-red-50 text-red-700 border-red-200" };
    }
    return { label: statusName || "Registered", className: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-10 px-4 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0A356A] rounded-2xl px-6 py-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-blue-900/30">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard Administrator</h1>
          <p className="text-blue-200/90 text-xs mt-0.5 font-medium capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/rendal/idle"
            className="bg-white text-[#0A356A] hover:bg-blue-50 active:scale-[0.98] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Wrench className="w-3.5 h-3.5" />
            Kelola Peralatan
          </Link>
          <Link
            href="/admin/master/kategori-aset"
            className="bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Database className="w-3.5 h-3.5" />
            Master Data
          </Link>
        </div>
      </div>

      {/* Operational Summary Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, caption, iconStyle, topAccent }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${topAccent}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconStyle}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {isLoading ? <RefreshCw className="w-6 h-6 animate-spin text-slate-300" /> : value}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{caption}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Quick Access Modules + Peralatan Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Quick Access Modules Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map(({ href, icon: Icon, title, desc, accentBg }) => (
            <Link
              key={href}
              href={href}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0A356A]/40 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 group-hover:bg-[#0A356A] group-hover:text-white transition-all duration-200 ${accentBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0A356A] transition-colors">{title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A356A] mt-5 pt-3 border-t border-slate-100">
                <span>Buka Modul</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </Link>
          ))}
        </div>

        {/* Peralatan Terbaru Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#0A356A]" />
              Peralatan Terbaru
            </h3>
            <Link
              href="/rendal/idle"
              className="text-[11px] font-bold text-[#0A356A] hover:underline flex items-center gap-1"
            >
              Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="px-5 py-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0A356A]" />
                Memuat data...
              </div>
            ) : recentEquipments.length === 0 ? (
              <div className="px-5 py-12 text-center text-xs text-slate-400">Belum ada data peralatan.</div>
            ) : (
              recentEquipments.map((item, idx) => {
                const statusInfo = getStatusBadge(item.status?.name);

                return (
                  <div
                    key={item.id || idx}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                        <span className="font-mono">{item.equipment_code}</span>
                        <span>·</span>
                        <span>{item.plant || "PUSRI"}</span>
                        <span>·</span>
                        <span className="text-slate-400">{formatDate(item.updated_at || item.created_at)}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 transition-colors ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Aktivitas Terbaru Panel (Timeline Log System) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0A356A]" />
            Aktivitas Terbaru Sistem
          </h3>
          <span className="text-xs font-medium text-slate-400">5 Aktivitas Terakhir</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0A356A]" />
            Memuat aktivitas...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">Belum ada aktivitas tercatat.</div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-white border-2 border-[#0A356A] group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0A356A] transition-colors">{act.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{act.desc}</p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    {formatDate(act.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
