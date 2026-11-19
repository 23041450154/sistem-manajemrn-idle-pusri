"use client";

import { X, AlertTriangle } from "lucide-react";
interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Hapus Data",
  description = "Apakah Anda yakin ingin menghapus data ini?",
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0F172A]/50" onClick={onClose} />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-white rounded shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)] border border-[#E6E8EA] w-full max-w-md flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 truncate">{title}</h3>
          </div>
          <button
            type="button"
            aria-label="Tutup dialog hapus"
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto scroll-smooth">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menghapus...
              </>
            ) : (
              "Ya, Hapus"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
