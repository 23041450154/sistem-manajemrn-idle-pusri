"use client";

import React from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, CheckCircle, XCircle, Wrench, FileText } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { ActionType } from "@/config/rbac";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export interface CustomActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  variant?: "primary" | "secondary" | "danger" | "warning" | "ghost" | "purple" | "emerald";
  tooltip?: string;
  disabled?: boolean;
  permission?: ActionType;
}

export interface ActionMenuProps {
  /** Map callback handlers untuk standar actions */
  onView?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onValidate?: (e: React.MouseEvent) => void;
  onApprove?: (e: React.MouseEvent) => void;
  onReject?: (e: React.MouseEvent) => void;

  /** Tooltip khusus (opsional) */
  viewTooltip?: string;
  editTooltip?: string;
  deleteTooltip?: string;

  /** Actions tambahan sesuai workflow modul tertentu */
  customActions?: CustomActionItem[];

  /** Overrides permission eksplisit jika diperlukan */
  permissions?: ActionType[];

  className?: string;
}

export function ActionMenu({
  onView,
  onEdit,
  onDelete,
  onValidate,
  onApprove,
  onReject,
  viewTooltip = "Detail Eagle Eye",
  editTooltip = "Edit Data",
  deleteTooltip = "Hapus Data",
  customActions = [],
  permissions: explicitPermissions,
  className = "flex items-center justify-center gap-1.5",
}: ActionMenuProps) {
  const { hasPermission: contextHasPermission } = useUser();

  const checkAllowed = (action: ActionType): boolean => {
    if (explicitPermissions) {
      return explicitPermissions.includes(action);
    }
    return contextHasPermission(action);
  };

  const canView = onView && checkAllowed("view");
  const canEdit = onEdit && checkAllowed("edit");
  const canDelete = onDelete && checkAllowed("delete");
  const canValidate = onValidate && checkAllowed("validate");
  const canApprove = onApprove && checkAllowed("approve");
  const canReject = onReject && checkAllowed("reject");

  return (
    <div className={className}>
      {/* Custom Workflow Actions (misal: Mulai Inspeksi link/button) */}
      {customActions.map((act) => {
        if (act.permission && !checkAllowed(act.permission)) {
          return null;
        }

        const buttonStyle =
          act.variant === "primary"
            ? "bg-[#0A356A] text-white hover:bg-[#0556B3] px-3.5 py-1.5 rounded-xl text-xs font-semibold h-[34px] inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            : act.variant === "danger"
            ? "text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-1.5 rounded-md inline-flex items-center justify-center cursor-pointer"
            : act.variant === "emerald"
            ? "bg-emerald-600 text-white hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold h-[34px] inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 w-8 p-1.5 rounded-md inline-flex items-center justify-center cursor-pointer";

        if (act.href) {
          return (
            <Link key={act.key} href={act.href}>
              {act.tooltip ? (
                <Tooltip content={act.tooltip}>
                  <Button variant="ghost" size="sm" type="button" className={buttonStyle}>
                    {act.icon}
                    {act.label}
                  </Button>
                </Tooltip>
              ) : (
                <span className={buttonStyle}>
                  {act.icon}
                  {act.label}
                </span>
              )}
            </Link>
          );
        }

        return (
          <React.Fragment key={act.key}>
            {act.tooltip ? (
              <Tooltip content={act.tooltip}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={act.onClick}
                  disabled={act.disabled}
                  className={buttonStyle}
                >
                  {act.icon}
                  {act.label}
                </Button>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={act.onClick}
                disabled={act.disabled}
                className={buttonStyle}
              >
                {act.icon}
                {act.label}
              </Button>
            )}
          </React.Fragment>
        );
      })}

      {/* Validate Action */}
      {canValidate && (
        <Tooltip content="Validasi Teknisi">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onValidate}
            className="h-8 w-8 p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}

      {/* Approve Action */}
      {canApprove && (
        <Tooltip content="Setujui">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onApprove}
            className="h-8 w-8 p-1.5 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}

      {/* Reject Action */}
      {canReject && (
        <Tooltip content="Tolak">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onReject}
            className="h-8 w-8 p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}

      {/* Standard View (Eagle Eye) Action */}
      {canView && (
        <Tooltip content={viewTooltip}>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onView}
            className="h-8 w-8 p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}

      {/* Standard Edit Action (Hanya jika role memiliki permission 'edit') */}
      {canEdit && (
        <Tooltip content={editTooltip}>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onEdit}
            className="h-8 w-8 p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}

      {/* Standard Delete Action (Hanya jika role memiliki permission 'delete') */}
      {canDelete && (
        <Tooltip content={deleteTooltip}>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onDelete}
            className="h-8 w-8 p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
