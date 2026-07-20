"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { normalizeRole } from "@/lib/roles";
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
  // Setiap role punya konten sidebar sendiri yang menunjuk ke folder rutenya.
  // Isi menu masih placeholder — sesuaikan href/label saat halaman siap.
  const userRole = normalizeRole(role);

  type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };
  let mainNavItems: NavItem[] = [];
  let adminNavItems: NavItem[] = [];
  let showAdminNav = false;
  // Tautan CTA di bawah sidebar (placeholder, null jika role tak punya).
  let registerCta: { name: string; href: string } | null = null;

  switch (userRole) {
    case "ADMIN":
      // Placeholder: Administrator (akses penuh)
      mainNavItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Peralatan", href: "/admin/peralatan", icon: Wrench },
        { name: "Idle Equipment", href: "/admin/idle", icon: PowerOff },
        { name: "Inspeksi", href: "/admin/inspeksi", icon: ClipboardCheck },
        { name: "Persetujuan", href: "/admin/persetujuan", icon: CheckSquare },
        { name: "Laporan", href: "/admin/laporan", icon: FileText },
      ];
      adminNavItems = [
        { name: "Master Data", href: "/admin/master", icon: Database },
        { name: "Pengguna", href: "/admin/pengguna", icon: Users },
        { name: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
      ];
      showAdminNav = true;
      break;

    case "RENDAL_PEMELIHARAAN":
      // Placeholder: Rendal Pemeliharaan
      mainNavItems = [
        { name: "Dashboard", href: "/rendal/dashboard", icon: LayoutDashboard },
        { name: "Peralatan", href: "/rendal/peralatan", icon: Wrench },
        { name: "Idle Equipment", href: "/rendal/idle", icon: PowerOff },
        { name: "Laporan", href: "/rendal/laporan", icon: FileText },
      ];
      registerCta = { name: "Register Equipment", href: "/rendal/register-equipment" };
      break;

    case "INSPEKSI_TEKNIK":
      // Placeholder: Inspeksi Teknik
      mainNavItems = [
        { name: "Dashboard", href: "/inspeksi/dashboard", icon: LayoutDashboard },
        { name: "Validasi Kelayakan", href: "/inspeksi/validasi", icon: Wrench },
        { name: "Manajemen Inspeksi", href: "/inspeksi/dashboard", icon: ClipboardCheck },
        { name: "Laporan", href: "/inspeksi/laporan", icon: FileText },
      ];
      break;

    case "MANAJER_RENDAL":
      // Placeholder: Manajer Rendal
      mainNavItems = [
        { name: "Dashboard", href: "/manajer/dashboard", icon: LayoutDashboard },
        { name: "Persetujuan", href: "/manajer/approve", icon: CheckSquare },
        { name: "Laporan", href: "/manajer/laporan", icon: FileText },
      ];
      break;

    case "UNIT_KERJA_OPERASI":
    default:
      // Placeholder: Unit Kerja Operasi (role default / user sebenarnya)
      mainNavItems = [
        { name: "Dashboard", href: "/unit-kerja/dashboard", icon: LayoutDashboard },
        { name: "Idle Equipment", href: "/unit-kerja/idle", icon: PowerOff },
        { name: "Permintaan", href: "/unit-kerja/permintaan", icon: FileQuestion },
        { name: "Laporan", href: "/unit-kerja/laporan", icon: FileText },
      ];
      break;
  }

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

      {registerCta && (
        <div className="p-4 mt-auto">
          <Link href={registerCta.href} className="w-full flex items-center justify-center gap-2 bg-[#0556B3] hover:bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md">
            <Plus className="w-4 h-4" />
            {registerCta.name}
          </Link>
        </div>
      )}
    </aside>
  );
}
