"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertTriangle, CheckCircle2, XCircle, Loader2, Database, MapPin, Tag, ShieldCheck, Layers } from "lucide-react";
import { 
  getObjectTypes, createObjectType, deleteObjectType,
  getStorageLocations, createStorageLocation, deleteStorageLocation,
  getRequireActions, createRequireAction, deleteRequireAction
} from "@/action/api";

type MasterTab = "objectTypes" | "storageLocations" | "requireActions";

const TABS = {
  objectTypes: { label: "Kategori Aset", icon: Tag, addLabel: "Tambah Kategori Aset" },
  storageLocations: { label: "Lokasi Penyimpanan", icon: MapPin, addLabel: "Tambah Lokasi Gudang" },
  requireActions: { label: "Rekomendasi Tindakan", icon: ShieldCheck, addLabel: "Tambah Tindakan Inspeksi" },
} as const;

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<MasterTab>("objectTypes");

  const [objectTypes, setObjectTypes] = useState<any[]>([]);
  const [storageLocations, setStorageLocations] = useState<any[]>([]);
  const [requireActions, setRequireActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form Fields
  const [itemName, setItemName] = useState("");
  const [itemPlant, setItemPlant] = useState("PUSRI-IB");
  const [itemDesc, setItemDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "objectTypes") {
        const data = await getObjectTypes();
        setObjectTypes(data);
      } else if (activeTab === "storageLocations") {
        const data = await getStorageLocations();
        setStorageLocations(data);
      } else if (activeTab === "requireActions") {
        const data = await getRequireActions();
        setRequireActions(data);
      }
    } catch (error) {
      console.error("Fetch master error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentData = () => {
    if (activeTab === "objectTypes") return objectTypes;
    if (activeTab === "storageLocations") return storageLocations;
    return requireActions;
  };

  const counts = {
    objectTypes: objectTypes.length,
    storageLocations: storageLocations.length,
    requireActions: requireActions.length,
  };

  const currentData = getCurrentData();
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const paginatedData = currentData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setIsSubmitting(true);
    let res: { success: boolean; message?: string } = { success: false };

    if (activeTab === "objectTypes") {
      res = await createObjectType(itemName);
    } else if (activeTab === "storageLocations") {
      res = await createStorageLocation(itemName, itemPlant, itemDesc);
    } else if (activeTab === "requireActions") {
      res = await createRequireAction(itemName, itemDesc);
    }

    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menambahkan data master baru!" });
      setItemName("");
      setItemDesc("");
      setIsAddOpen(false);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "Gagal menambahkan data: " + (res.message || "Silakan coba lagi.") });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    let res: { success: boolean; message?: string } = { success: false };

    if (activeTab === "objectTypes") {
      res = await deleteObjectType(selectedItem.id);
    } else if (activeTab === "storageLocations") {
      res = await deleteStorageLocation(selectedItem.id);
    } else if (activeTab === "requireActions") {
      res = await deleteRequireAction(selectedItem.id);
    }

    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menghapus data master!" });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "Gagal menghapus data: " + (res.message || "Pastikan tidak ada data yang terkait atau coba lagi.") });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-12 px-4 sm:px-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border border-gray-700">
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
          <span className="text-[13px] font-medium leading-snug">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A356A] rounded-2xl px-6 py-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Pengelolaan Master Data Referensi
            </h1>
            <p className="text-xs text-blue-200/90 mt-0.5 font-medium max-w-xl">
              Konfigurasi data referensi sistem untuk seluruh formulir inspeksi &amp; inventaris.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setItemName("");
            setItemDesc("");
            setIsAddOpen(true);
          }}
          className="bg-white hover:bg-blue-50 active:scale-[0.98] text-[#0A356A] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{TABS[activeTab].addLabel}</span>
        </button>
      </div>

      {/* Navigation Pills Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-gray-200/80 shadow-sm mb-6 flex flex-wrap gap-2">
        {(Object.keys(TABS) as MasterTab[]).map((key) => {
          const { label, icon: Icon } = TABS[key];
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? "bg-[#0A356A] text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Data Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500">Memuat data master referensi...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-[#0A356A] rounded-2xl flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Belum Ada Data Master</h3>
            <p className="text-xs text-slate-500 max-w-md">Silakan tambahkan data referensi baru menggunakan tombol "+ Tambah".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">ID</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nama Entri</th>
                  {activeTab === "storageLocations" && (
                    <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pabrik (Plant)</th>
                  )}
                  {activeTab !== "objectTypes" && (
                    <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deskripsi Keterangan</th>
                  )}
                  <th className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedData.map((item) => {
                  const RowIcon = TABS[activeTab].icon;
                  return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-medium text-slate-400">#{item.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-900">
                      <span className="inline-flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-[#0A356A] flex items-center justify-center shrink-0 group-hover:bg-[#0A356A] group-hover:text-white transition-colors">
                          <RowIcon className="w-3.5 h-3.5" />
                        </span>
                        {item.name}
                      </span>
                    </td>
                    {activeTab === "storageLocations" && (
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-500">
                        {item.plant || "-"}
                      </td>
                    )}
                    {activeTab !== "objectTypes" && (
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-md">
                        {item.description || <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDeleteOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        title="Hapus Master Data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {currentData.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan {currentData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, currentData.length)} dari {currentData.length} data
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                        currentPage === page
                          ? "bg-[#0A356A] text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Tambah Data */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsAddOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0A356A]" />
                {activeTab === "objectTypes" && "Tambah Kategori Aset Baru"}
                {activeTab === "storageLocations" && "Tambah Lokasi Gudang Baru"}
                {activeTab === "requireActions" && "Tambah Tindakan Inspeksi Baru"}
              </h3>
            </div>

            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Entri <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={
                    activeTab === "objectTypes" ? "Contoh: Valve, Rotating Equipment" :
                    activeTab === "storageLocations" ? "Contoh: Gudang Pemeliharaan Sentral" :
                    "Contoh: Perlu Overhaul Total"
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all font-medium"
                />
              </div>

              {activeTab === "storageLocations" && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Plant / Pabrik <span className="text-red-500">*</span></label>
                  <select
                    value={itemPlant}
                    onChange={(e) => setItemPlant(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none font-semibold text-slate-700 cursor-pointer"
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
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Keterangan / Deskripsi</label>
                  <textarea
                    rows={3}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Masukkan deskripsi rinci..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all resize-none font-medium"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-70"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !itemName.trim()}
                  className="px-5 py-2.5 bg-[#0A356A] text-white rounded-xl text-xs font-bold hover:bg-[#0556B3] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {isDeleteOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsDeleteOpen(false)} />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">Hapus Data Master?</h3>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed font-medium">
              Anda akan menghapus data <span className="font-bold text-slate-900">"{selectedItem.name}"</span>.
              <br/><br/>
              Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi pilihan dropdown pada modul aplikasi terkait.
            </p>

            <div className="flex items-center gap-3 w-full justify-center mt-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors w-full disabled:opacity-70"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#dc2626] text-white rounded-xl text-xs font-bold hover:bg-[#b91c1c] transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isSubmitting ? "Menghapus..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
