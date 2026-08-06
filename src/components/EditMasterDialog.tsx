"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";

interface EditMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (updatedItem: any) => void;
  item: any;
  activeTab: "objectTypes" | "storageLocations" | "requireActions";
}

export function EditMasterDialog({ open, onClose, onSaved, item, activeTab }: EditMasterDialogProps) {
  const [name, setName] = useState("");
  const [plant, setPlant] = useState("PUSRI-IB");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item && open) {
      setName(item.name || "");
      setPlant(item.plant || "PUSRI-IB");
      setDescription(item.description || "");
    }
  }, [item, open]);

  if (!open || !item) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    // Simulate save / local update for master entry
    setTimeout(() => {
      onSaved({
        ...item,
        name,
        plant: activeTab === "storageLocations" ? plant : item.plant,
        description: activeTab !== "objectTypes" ? description : item.description,
      });
      setIsSaving(false);
      onClose();
    }, 400);
  };

  const titleMap = {
    objectTypes: "Edit Kategori Aset",
    storageLocations: "Edit Lokasi Gudang",
    requireActions: "Edit Rekomendasi Tindakan",
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

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              Nama Entri *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20"
            />
          </div>

          {activeTab === "storageLocations" && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Plant / Pabrik *
              </label>
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 cursor-pointer"
              >
                <option value="PUSRI-IB">PUSRI-IB</option>
                <option value="PUSRI-IIB">PUSRI-IIB</option>
                <option value="PUSRI-III">PUSRI-III</option>
                <option value="PUSRI-IV">PUSRI-IV</option>
                <option value="STG-1">STG-1 (Utilitas)</option>
              </select>
            </div>
          )}

          {activeTab !== "objectTypes" && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Keterangan / Deskripsi
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] text-gray-900 outline-none focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A]/20 resize-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-[#0A356A] rounded-md hover:bg-[#0556B3] flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
