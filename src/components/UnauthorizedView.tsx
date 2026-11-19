"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut } from "lucide-react";
import { getCurrentUserAction } from "@/action/auth";
import {
  homePathForRole,
  isValidRole,
  labelForRole,
  requiredRoleForPath,
  type Role,
} from "@/lib/roles";

export function UnauthorizedView({
  currentRole,
  requiredRole,
  embedded = false,
}: {
  currentRole?: string | null;
  requiredRole?: Role | null;
  embedded?: boolean;
}) {
  const pathname = usePathname();
  const [fetchedRole, setFetchedRole] = useState<string | null>(null);

  useEffect(() => {
    if (currentRole) return;
    let alive = true;
    void (async () => {
      const res = await getCurrentUserAction().catch(() => null);
      if (!alive || !res?.status || !res.user?.role) return;
      setFetchedRole(res.user.role);
    })();
    return () => {
      alive = false;
    };
  }, [currentRole]);

  const effectiveRole = currentRole ?? fetchedRole;
  const targetRole = requiredRole ?? requiredRoleForPath(pathname);
  const dashboardHref =
    effectiveRole && isValidRole(effectiveRole)
      ? homePathForRole(effectiveRole)
      : "/";

  const card = (
    <div className="w-full max-w-md rounded-[4px] border border-[#E6E8EA] bg-white p-6 sm:p-8 shadow-sm text-left">
      <div className="inline-flex items-center gap-2 rounded-[4px] border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-[#DC2626]">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>401 UNAUTHORIZED</span>
      </div>

      <h1 className="mt-4 text-[20px] font-bold tracking-[-0.01em] text-[#0F172A]">
        Akses Tidak Diizinkan
      </h1>

      <p className="mt-2 text-[14px] leading-relaxed text-[#475569]">
        Anda tidak memiliki hak akses untuk membuka menu atau halaman milik role
        lain.
      </p>

      {(effectiveRole || targetRole) && (
        <dl className="mt-4 space-y-2 rounded-[4px] border border-[#E6E8EA] bg-[#F8F9FA] p-3.5 text-[12px]">
          {effectiveRole && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#64748B]">Role Anda saat ini</dt>
              <dd className="font-semibold text-[#0F172A]">
                {labelForRole(effectiveRole)}
              </dd>
            </div>
          )}
          {targetRole && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[#64748B]">Role yang dibutuhkan</dt>
              <dd className="font-semibold text-[#0A356A]">
                {labelForRole(targetRole)}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <Link
          href={dashboardHref}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[4px] bg-[#0A356A] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#082B56] focus-visible:ring-2 focus-visible:ring-[#334155] focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span>Kembali ke Dashboard</span>
        </Link>

        <Link
          href="/logout"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border border-[#E6E8EA] bg-white px-4 text-[13px] font-semibold text-[#334155] transition-colors hover:bg-[#F2F3F4] hover:text-[#0F172A] focus-visible:ring-2 focus-visible:ring-[#334155] focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span>Keluar</span>
        </Link>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4 py-10">
        {card}
      </div>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#F8F9FA] px-6 py-12 font-sans">
      {card}
    </main>
  );
}
