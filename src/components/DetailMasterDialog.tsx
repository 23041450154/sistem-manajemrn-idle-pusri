"use client";

import { X, Pencil } from "lucide-react";

interface DetailMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  item: any;
  activeTab: "objectTypes" | "storageLocations" | "requireActions";
}

export function DetailMasterDialog({ open, onClose, onEdit, item, activeTab }: DetailMasterDialogProps) {
  if (!open || !item) return null;

  const titleMap = {
    objectTypes: "Detail Kategori Aset",
    storageLocations: "Detail Lokasi Gudang",
    requireActions: "Detail Rekomendasi Tindakan",
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[15px] font-bold text-gray-900">{titleMap[activeTab]}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              ID
            </label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[13px] font-mono font-medium text-gray-800">
              #{item.id}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Nama Entri
            </label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[13px] font-medium text-gray-800">
              {item.name || "-"}
            </div>
          </div>

          {activeTab === "storageLocations" && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Plant / Pabrik
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[13px] font-medium text-gray-800">
                {item.plant || "-"}
              </div>
            </div>
          )}

          {activeTab !== "objectTypes" && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Keterangan / Deskripsi
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[13px] font-medium text-gray-800 min-h-[60px] whitespace-pre-wrap">
                {item.description || "-"}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Tutup
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-[#0A356A] rounded-md hover:bg-[#0556B3] flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
