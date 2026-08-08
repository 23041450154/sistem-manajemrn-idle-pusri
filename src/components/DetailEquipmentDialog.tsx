"use client";

import React from "react";
import { X, Pencil } from "lucide-react";

interface DetailEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  equipment: any;
}

export function DetailEquipmentDialog({ open, onClose, onEdit, equipment }: DetailEquipmentDialogProps) {
  if (!open || !equipment) return null;

  const data = {
    equipment_code: equipment.equipment_code || equipment.kodeAlat || "-",
    name: equipment.name || equipment.namaAlat || "-",
    plant: equipment.plant || "-",
    jenisAlat: equipment.jenisAlat || equipment.object_type?.name || "-",
    storage_location: equipment.storage_location || equipment.storageLocation || equipment.storage_location_ref?.name || "-",
    functional_location: equipment.functional_location || equipment.funcLoc || "-",
    vendor: equipment.vendor || "-",
    year_of_manufacture: equipment.year_of_manufacture || equipment.year || "-",
    original_value: equipment.original_value || equipment.originalValue ? `Rp ${(equipment.original_value || equipment.originalValue).toLocaleString('id-ID')}` : "-",
    statusAset: equipment.status || equipment.statusAset || "-",
    statusPersetujuan: equipment.statusPersetujuan || "-",
    tanggalRegistrasi: equipment.tanggalRegistrasi || equipment.created_at ? new Date(equipment.tanggalRegistrasi || equipment.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-",
    notes: equipment.notes || "-",
  };

  const fields = [
    { label: "Kode Aset", value: data.equipment_code },
    { label: "Nama Peralatan", value: data.name },
    { label: "Plant", value: data.plant },
    { label: "Jenis Alat", value: data.jenisAlat },
    { label: "Lokasi Penyimpanan", value: data.storage_location },
    { label: "Functional Location", value: data.functional_location },
    { label: "Vendor / Produsen", value: data.vendor },
    { label: "Tahun Produksi", value: data.year_of_manufacture },
    { label: "Nilai Asal", value: data.original_value },
    { label: "Tanggal Registrasi", value: data.tanggalRegistrasi },
    { label: "Status Aset", value: data.statusAset },
    { label: "Status Persetujuan", value: data.statusPersetujuan },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Detail Data Peralatan</h2>
            <p className="text-[12px] text-gray-500 font-mono mt-0.5">{data.equipment_code}</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {fields.map((f, i) => (
              <div key={i} className={f.label === "Nama Peralatan" ? "col-span-2" : ""}>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {f.label}
                </label>
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-800">
                  {f.value}
                </div>
              </div>
            ))}

            {/* Catatan - full width */}
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Catatan
              </label>
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-800 min-h-[60px] whitespace-pre-wrap">
                {data.notes}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                onEdit();
              }}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-[#0A356A] rounded-xl hover:bg-[#0556B3] transition-colors flex items-center gap-2 shadow-sm"
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
