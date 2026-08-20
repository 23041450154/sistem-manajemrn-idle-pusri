"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { getEquipmentById, updateEquipment, getStorageLocations, getObjectTypes, getPlants } from "@/action/api";

interface EditEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  equipment: any;
}

function extractStringValue(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    return val.name || val.label || val.equipment_code || (val.id ? String(val.id) : "");
  }
  return String(val);
}

export function EditEquipmentDialog({ open, onClose, onSaved, equipment }: EditEquipmentDialogProps) {
  const [form, setForm] = useState({
    name: "",
    equipment_code: "",
    plant: "",
    storage_location: "",
    functional_location: "",
    vendor: "",
    year_of_manufacture: "",
    original_value: "",
    notes: "",
  });

  const [storageOptions, setStorageOptions] = useState<any[]>([]);
  const [objectTypes, setObjectTypes] = useState<any[]>([]);
  const [plantOptions, setPlantOptions] = useState<any[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!equipment || !open) return;

    // 1. INSTANT Pre-fill from table row data (Zero Blocking Loading Spinner)
    const initialData = {
      name: extractStringValue(equipment.name || equipment.namaAlat || equipment.equipment_name),
      equipment_code: extractStringValue(equipment.equipment_code || equipment.kodeAlat || equipment.kodeAset),
      plant: extractStringValue(equipment.plant || equipment.plant_description),
      storage_location: extractStringValue(equipment.storage_location || equipment.storageLocation || equipment.storage_location_ref?.name || equipment.lokasiPenyimpanan),
      functional_location: extractStringValue(equipment.functional_location || equipment.func_loc || equipment.funcLoc || equipment.functional_location_id || equipment.area),
      vendor: extractStringValue(equipment.vendor),
      year_of_manufacture: extractStringValue(equipment.year_of_manufacture || equipment.year || equipment.tahunDibuat),
      original_value: extractStringValue(equipment.original_value || equipment.originalValue || equipment.nilaiPerolehan).replace(/[^0-9.]/g, ""),
      notes: extractStringValue(equipment.notes || equipment.alasanIdle || equipment.description || equipment.spesifikasi),
    };

    setForm(initialData);
    setError(null);

    // 2. Fetch master options in background
    getStorageLocations().then((locs) => {
      if (isMounted && locs && Array.isArray(locs)) {
        setStorageOptions(locs);
      }
    }).catch((e) => console.error("Error fetching storage locations:", e));

    getObjectTypes().then((types) => {
      if (isMounted && types && Array.isArray(types)) {
        setObjectTypes(types);
      }
    }).catch((e) => console.error("Error fetching object types:", e));

    getPlants().then((plants) => {
      if (isMounted && Array.isArray(plants)) setPlantOptions(plants);
    }).catch((e) => console.error("Error fetching plants:", e));

    // 3. Non-blocking background fetch for full API detail
    const targetId = equipment.id || equipment.ID || equipment.equipment_id || equipment.equipmentId;
    if (targetId) {
      getEquipmentById(String(targetId)).then((detail) => {
        if (detail && isMounted) {
          setForm((prev) => ({
            name: extractStringValue(detail.name || detail.namaAlat || detail.equipment_name) || prev.name,
            equipment_code: extractStringValue(detail.equipment_code || detail.kodeAlat || detail.kodeAset) || prev.equipment_code,
            plant: extractStringValue(detail.plant || detail.plant_description) || prev.plant,
            storage_location: extractStringValue(detail.storage_location || detail.storageLocation || detail.storage_location_ref?.name || detail.storage_location_id) || prev.storage_location,
            functional_location: extractStringValue(detail.functional_location || detail.func_loc || detail.funcLoc || detail.functional_location_id) || prev.functional_location,
            vendor: extractStringValue(detail.vendor) || prev.vendor,
            year_of_manufacture: extractStringValue(detail.year_of_manufacture || detail.year) || prev.year_of_manufacture,
            original_value: extractStringValue(detail.original_value || detail.originalValue).replace(/[^0-9.]/g, "") || prev.original_value,
            notes: extractStringValue(detail.notes || detail.alasanIdle || detail.description || detail.spesifikasi) || prev.notes,
          }));
        }
      }).catch((err) => {
        console.error("Non-blocking detail load warning:", err);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [equipment, open]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsSaving(true);
    setError(null);
    try {
      const id = equipment.id || equipment.ID || equipment.equipment_id || equipment.equipmentId;
      if (!id) {
        setError("ID peralatan tidak ditemukan.");
        setIsSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {};
      
      if (form.equipment_code) payload.equipment_code = form.equipment_code;
      if (form.name) payload.name = form.name;
      if (form.plant) payload.plant = form.plant;
      if (form.storage_location) payload.storage_location = form.storage_location;
      if (form.functional_location) payload.functional_location = form.functional_location;
      if (form.vendor) payload.vendor = form.vendor;
      if (form.year_of_manufacture) payload.year_of_manufacture = parseInt(form.year_of_manufacture) || undefined;
      if (form.original_value) payload.original_value = parseFloat(form.original_value) || undefined;
      if (form.notes !== undefined) payload.notes = form.notes;

      const result = await updateEquipment(String(id), payload);
      if (result.success) {
        onSaved();
        onClose();
      } else {
        setError(result.message || "Gagal menyimpan data.");
      }
    } catch (e: unknown) {
      setError("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open || !equipment) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog Window */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Edit Data Peralatan</h2>
            <p className="text-[12px] text-gray-500 font-mono mt-0.5">{form.equipment_code || "Kode Peralatan"}</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              {/* Kode Aset */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Kode Aset
                </label>
                <input
                  type="text"
                  value={form.equipment_code}
                  onChange={(e) => handleChange("equipment_code", e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors"
                />
              </div>

              {/* Plant */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Plant / Pabrik
                </label>
                <select
                  value={form.plant}
                  onChange={(e) => handleChange("plant", e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors cursor-pointer"
                >
                  <option value="">-- Pilih Plant --</option>
                  {plantOptions.map((plant) => (
                    <option key={plant.id} value={plant.name}>{plant.name}</option>
                  ))}
                </select>
              </div>

              {/* Nama Peralatan */}
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Nama Peralatan
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors"
                />
              </div>

              {/* Lokasi Penyimpanan */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Lokasi Penyimpanan
                </label>
                {storageOptions.length > 0 ? (
                  <select
                    value={form.storage_location}
                    onChange={(e) => handleChange("storage_location", e.target.value)}
                    disabled={isSaving}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors cursor-pointer"
                  >
                    <option value="">-- Pilih Lokasi --</option>
                    {storageOptions.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.plant || "PUSRI"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.storage_location}
                    onChange={(e) => handleChange("storage_location", e.target.value)}
                    disabled={isSaving}
                    placeholder="Contoh: Gudang Pemeliharaan Sentral"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors"
                  />
                )}
              </div>

              {/* Functional Location */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Functional Location (Area)
                </label>
                <input
                  type="text"
                  value={form.functional_location}
                  onChange={(e) => handleChange("functional_location", e.target.value)}
                  disabled={isSaving}
                  placeholder="Contoh: 100-FF-101"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors"
                />
              </div>

              {/* Vendor / Produsen */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Vendor / Produsen
                </label>
                <input
                  type="text"
                  value={form.vendor}
                  onChange={(e) => handleChange("vendor", e.target.value)}
                  disabled={isSaving}
                  placeholder="Contoh: Ebara Pumps Indonesia"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors"
                />
              </div>

              {/* Tahun Produksi */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Tahun Produksi
                </label>
                <input
                  type="number"
                  value={form.year_of_manufacture}
                  onChange={(e) => handleChange("year_of_manufacture", e.target.value)}
                  disabled={isSaving}
                  placeholder="Contoh: 2018"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors"
                />
              </div>

              {/* Nilai Asal */}
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Nilai Perolehan / Asal (Rp)
                </label>
                <input
                  type="number"
                  value={form.original_value}
                  onChange={(e) => handleChange("original_value", e.target.value)}
                  disabled={isSaving}
                  placeholder="Contoh: 150000000"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 transition-colors"
                />
              </div>

              {/* Catatan / Spesifikasi */}
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Catatan / Spesifikasi Peralatan
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  disabled={isSaving}
                  rows={3}
                  placeholder="Masukkan catatan spesifikasi teknis atau alasan idle..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 disabled:bg-gray-100 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl shrink-0">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
              disabled={isSaving}
              className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-[#0A356A] rounded-xl hover:bg-[#0556B3] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
