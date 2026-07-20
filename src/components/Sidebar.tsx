"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  PowerOff,
  ClipboardCheck,
  FileQuestion,
  CheckSquare,
  FileText,
  Database,
  Users,
  Settings,
  Plus,
  Trash2
} from "lucide-react";

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();

  // --- MENU ITEMS UNTUK MASING-MASING ROLE ---
  let mainNavItems = [];
  let showAdminNav = false;
  const userRole = role?.toUpperCase();

  if (userRole === "INSPECTOR") {
    // Menu khusus Inspeksi (Hanya hak akses yang diizinkan untuk inspektor)
    mainNavItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Manajemen Inspeksi", href: "/dashboard/inspeksi", icon: ClipboardCheck },
      { name: "Jadwal Inspeksi", href: "/dashboard/jadwal-inspeksi", icon: ClipboardCheck },
      { name: "Laporan", href: "/dashboard/laporan", icon: FileText },
    ];
  } else if (userRole === "USER") {
    // Menu khusus Unit Kerja
    mainNavItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Idle Equipment", href: "/dashboard/idle", icon: PowerOff },
      { name: "Permintaan", href: "/dashboard/permintaan", icon: FileQuestion },
      { name: "Laporan", href: "/dashboard/laporan", icon: FileText },
    ];
  } else {
    // Menu Default (Admin Rendal)
    mainNavItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Peralatan", href: "/dashboard/peralatan", icon: Wrench },
      { name: "Idle Equipment", href: "/dashboard/idle", icon: PowerOff },
      { name: "Inspeksi", href: "/dashboard/inspeksi", icon: ClipboardCheck },
      { name: "Permintaan Peralatan", href: "/dashboard/permintaan", icon: FileQuestion },
      { name: "Persetujuan", href: "/dashboard/persetujuan", icon: CheckSquare },
      { name: "Laporan", href: "/dashboard/laporan", icon: FileText },
    ];
    showAdminNav = true;
  }

  const adminNavItems = [
    { name: "Master Data", href: "/dashboard/master", icon: Database },
    { name: "Pengguna", href: "/dashboard/pengguna", icon: Users },
    { name: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0A356A] text-white flex flex-col h-screen shrink-0 sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <Image
          src="/images (2) 1.png"
          alt="Logo PUSRI"
          width={52}
          height={52}
          style={{ objectFit: 'contain' }}
        />
        <div>
          <p className="text-base text-white-300 mt-1 font-semibold">Asset Management</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-2 space-y-8">
        <div>
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-500/20 text-white border-l-4 border-white"
                        : "text-blue-100 hover:bg-[#10488f] hover:text-white border-l-4 border-transparent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {showAdminNav && (
          <div>
            <h2 className="px-3 text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-2">
              Administration
            </h2>
            <ul className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-500/20 text-white border-l-4 border-white"
                          : "text-blue-100 hover:bg-[#10488f] hover:text-white border-l-4 border-transparent"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {userRole !== "INSPECTOR" && (
        <div className="p-4 mt-auto">
          <Link href="/dashboard/register" className="w-full flex items-center justify-center gap-2 bg-[#0556B3] hover:bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md">
            <Plus className="w-4 h-4" />
            Register Equipment
          </Link>
        </div>
      )}
    </aside>
  );
}
