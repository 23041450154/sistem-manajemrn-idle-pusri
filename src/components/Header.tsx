"use client";

import { Search, Bell, HelpCircle, LogOut, Menu } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { logoutAction } from "@/action/auth";
import { labelForRole } from "@/lib/roles";
import { useSidebar } from "./SidebarProvider";

export function Header({ user }: { user?: any }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { toggleSidebar } = useSidebar();
  const name = user?.name || "Profil Saya";
  const role = labelForRole(user?.role);
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-[#0556B3] text-lg md:text-xl font-bold hidden sm:block">Idle Equipment</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari peralatan..."
            className="w-48 lg:w-64 pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#0556B3]/20 focus:border-[#0556B3] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4 text-gray-500">
          <button className="hover:text-gray-700 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          <button className="hover:text-gray-700 transition-colors hidden sm:block">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 md:gap-3 text-left focus:outline-none hover:bg-gray-50 p-1 md:p-1.5 rounded-lg transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-700">{name}</div>
              <div className="text-[11px] text-gray-500">{role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
              {/* Fallback avatar */}
              <div className="w-full h-full bg-[#0556B3] text-white flex items-center justify-center font-bold text-sm">
                {initial}
              </div>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              <button 
                onClick={() => logoutAction()}
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Log Out)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
