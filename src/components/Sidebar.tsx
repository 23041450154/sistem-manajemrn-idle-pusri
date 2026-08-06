"use client";

import { useState } from "react";
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
  Inbox,
  Database,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit,
  X,
  ShieldCheck,
  Boxes,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useSidebar } from "./SidebarProvider";

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(
    pathname.startsWith("/admin/master")
  );
  const [isAdminInspectionOpen, setIsAdminInspectionOpen] = useState(false);
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>({});

  const toggleSubGroup = (key: string) => {
    setOpenSubGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const masterDataSubItems = [
    { name: "Kategori Aset", href: "/admin/master/kategori-aset" },
    { name: "Lokasi Penyimpanan", href: "/admin/master/lokasi-penyimpanan" },
    { name: "Rekomendasi Tindakan", href: "/admin/master/rekomendasi-tindakan" },
  ];

  const roleGroups = [
    {
      title: "Rendal Pemeliharaan",
      items: [
        { name: "Peralatan", href: "/rendal/idle" },
        { name: "Perbaikan Alat", href: "/rendal/perbaikan-alat" },
        { name: "Verifikasi Disposal", href: "/rendal/disposal" },
      ]
    },
    {
      title: "Inspeksi Teknik",
      items: [
        { name: "List Equipment", href: "/inspeksi/validasi" },
        { name: "Revisi Validasi", href: "/inspeksi/revisi-validasi" },
        { name: "Inspeksi Berkala", href: "/inspeksi/inspeksi-berkala" },
        { name: "Manajemen Inspeksi", href: "/inspeksi/manajemen" },
      ]
    },
    {
      title: "Manajer Rendal",
      items: [
        { name: "Persetujuan Validasi", href: "/manajer/persetujuan-validasi" },
        { name: "Persetujuan Peminjaman", href: "/manajer/peminjaman" },
        { name: "Persetujuan Disposal", href: "/manajer/disposal" },
        { name: "Laporan", href: "/manajer/laporan" },
      ]
    },
    {
      title: "Unit Kerja Operasi",
      items: [
        { name: "Permintaan", href: "/unit-kerja/permintaan" },
        { name: "Idle Equipment", href: "/unit-kerja/idle" },
      ]
    }
  ];

  const userRole = normalizeRole(role);

  type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };
  let mainNavItems: NavItem[] = [];

  switch (userRole) {
    case "ADMIN":
      mainNavItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ];
      break;

    case "RENDAL_PEMELIHARAAN":
      mainNavItems = [
        { name: "Dashboard", href: "/rendal/dashboard", icon: LayoutDashboard },
        { name: "Peralatan", href: "/rendal/idle", icon: Boxes },
        { name: "Perbaikan Alat", href: "/rendal/perbaikan-alat", icon: Wrench },
        { name: "Verifikasi Disposal", href: "/rendal/disposal", icon: Trash2 },
      ];
      break;

    case "INSPEKSI_TEKNIK":
      mainNavItems = [
        { name: "Dashboard", href: "/inspeksi/dashboard", icon: LayoutDashboard },
        { name: "List Equipment", href: "/inspeksi/validasi", icon: Wrench },
        { name: "Revisi Validasi", href: "/inspeksi/revisi-validasi", icon: Edit },
        { name: "Inspeksi", href: "/inspeksi/inspeksi-berkala", icon: ClipboardCheck },
      ];
      break;

    case "MANAJER_RENDAL":
      mainNavItems = [
        { name: "Dashboard", href: "/manajer/dashboard", icon: LayoutDashboard },
        { name: "Persetujuan Validasi", href: "/manajer/persetujuan-validasi", icon: CheckSquare },
        { name: "Persetujuan Peminjaman", href: "/manajer/peminjaman", icon: FileText },
        { name: "Persetujuan Disposal", href: "/manajer/disposal", icon: Trash2 },
        { name: "Laporan", href: "/manajer/laporan", icon: ShieldCheck },
      ];
      break;

    case "UNIT_KERJA_OPERASI":
    default:
      mainNavItems = [
        { name: "Dashboard", href: "/unit-kerja/dashboard", icon: LayoutDashboard },
        { name: "Permintaan", href: "/unit-kerja/permintaan", icon: FileQuestion },
        { name: "Laporan", href: "/unit-kerja/laporan", icon: FileText },
      ];
      break;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 w-64 bg-[#0A356A] text-white flex flex-col h-screen shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out print:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
          <button 
            className="md:hidden text-blue-200 hover:text-white focus:outline-none"
            onClick={closeSidebar}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
          <div>
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  pathname.startsWith(item.href + "/") ||
                  (item.href === "/rendal/idle" && pathname === "/rendal/register-equipment");
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

            {userRole === "ADMIN" && (
              <>
                {/* Master Data Collapsible */}
                <div className="mt-4 pt-3 border-t border-blue-800/40">
                  <button
                    onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-[#10488f] hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4" />
                      <span>Master Data</span>
                    </div>
                    {isMasterDataOpen ? (
                      <ChevronDown className="w-4 h-4 text-blue-300" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-blue-300" />
                    )}
                  </button>

                  {isMasterDataOpen && (
                    <ul className="mt-1 pl-7 border-l border-blue-800/60 space-y-1">
                      {masterDataSubItems.map((subItem) => {
                        const isActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                        return (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              onClick={closeSidebar}
                              className={`block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                isActive
                                  ? "text-white font-bold bg-blue-500/20"
                                  : "text-blue-300 hover:text-white hover:bg-[#10488f]/30"
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Kelola Data Collapsible */}
                <div className="mt-2 pt-2 border-t border-blue-800/40">
                  <button
                    onClick={() => setIsAdminInspectionOpen(!isAdminInspectionOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-[#10488f] hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Kelola Data</span>
                    </div>
                    {isAdminInspectionOpen ? (
                      <ChevronDown className="w-4 h-4 text-blue-300" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-blue-300" />
                    )}
                  </button>

                  {isAdminInspectionOpen && (
                    <div className="mt-2 pl-4 space-y-2">
                      {roleGroups.map((group) => {
                        const isGroupOpen = !!openSubGroups[group.title];
                        return (
                          <div key={group.title} className="space-y-1">
                            <button
                              onClick={() => toggleSubGroup(group.title)}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold text-blue-200 hover:bg-[#10488f]/50 hover:text-white transition-colors"
                            >
                              <span>{group.title}</span>
                              {isGroupOpen ? (
                                <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                              )}
                            </button>

                            {isGroupOpen && (
                              <ul className="pl-3 border-l border-blue-800/60 space-y-1">
                                {group.items.map((subItem) => {
                                  const isActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                                  return (
                                    <li key={subItem.name}>
                                      <Link
                                        href={subItem.href}
                                        onClick={closeSidebar}
                                        className={`block px-2 py-1 rounded text-xs transition-colors ${
                                          isActive
                                            ? "text-white font-bold bg-blue-500/20"
                                            : "text-blue-300 hover:text-white hover:bg-[#10488f]/30"
                                        }`}
                                      >
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
