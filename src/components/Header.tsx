"use client";

import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useSidebar } from "./SidebarProvider";
import { NotificationDropdown } from "@/components/NotificationDropdown";

/* ponytail: payload user legacy bervariasi (langsung / dibungkus {user}, NPP di
   npp / contact_npp / contactNpp). Longgarkan sampai DTO bersama tersedia. */
type HeaderUser = {
  name?: string;
  role?: string;
  npp?: string;
  contact_npp?: string;
  contactNpp?: string;
  user?: HeaderUser;
};

export function Header({ user }: { user?: HeaderUser }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  const currentUser = user?.user || user;
  const name = currentUser?.name || "Profil Saya";
  const rawNpp =
    currentUser?.npp ||
    currentUser?.contact_npp ||
    currentUser?.contactNpp ||
    "";
  const npp = rawNpp
    ? String(rawNpp).toUpperCase().startsWith("NPP")
      ? String(rawNpp)
      : `NPP: ${rawNpp}`
    : "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-10 print:hidden">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-[#0556B3] text-lg md:text-xl font-bold hidden sm:block">
          Idle Equipment
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center">
          <NotificationDropdown role={currentUser?.role || user?.role} />
        </div>

        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 md:gap-3 text-left focus:outline-none hover:bg-gray-50 p-1 md:p-1.5 rounded-lg transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-800 leading-snug">
                {name}
              </div>
              {npp && <div className="text-[11px] text-gray-500">{npp}</div>}
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-300 shrink-0">
              {/* Fallback avatar */}
              <div className="w-full h-full bg-[#0556B3] text-white flex items-center justify-center font-bold text-sm">
                {initial}
              </div>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {name}
                </p>
                {npp && (
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {npp}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsLogoutOpen(true)}
                className="flex items-center w-full gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Log Out)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={() => window.location.assign("/logout")}
        title="Keluar dari Aplikasi?"
        description="Sesi Anda akan diakhiri dan Anda kembali ke halaman login."
        confirmLabel="Ya, Keluar"
        tone="destructive"
      />
    </header>
  );
}
