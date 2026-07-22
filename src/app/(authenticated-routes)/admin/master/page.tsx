"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, AlertTriangle, CheckCircle2, XCircle, Loader2, Database } from "lucide-react";
import { getObjectTypes, createObjectType, deleteObjectType } from "@/action/api";

export default function MasterDataPage() {
  const [objectTypes, setObjectTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newItemName, setNewItemName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [notification, setNotification] = useState<{type: "success"|"error", message: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getObjectTypes();
      setObjectTypes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsSubmitting(true);
    const res = await createObjectType(newItemName);
    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menambahkan kategori aset baru!" });
      setNewItemName("");
      setIsAddOpen(false);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "Gagal menambahkan kategori: " + (res.message || "Silakan coba lagi.") });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    const res = await deleteObjectType(selectedItem.id);
    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menghapus kategori aset!" });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "Gagal menghapus kategori: " + (res.message || "Pastikan tidak ada data yang terkait atau coba lagi.") });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-8 px-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-[70] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
          <span className="text-[13px] font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-[#0A356A]" />
            Master Data: Kategori Aset
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">Kelola daftar kategori atau tipe peralatan yang tersedia dalam sistem.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-[#0A356A] hover:bg-[#0556B3] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Tabel Kategori */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-500">Memuat data kategori...</p>
          </div>
        ) : objectTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Database className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Belum Ada Data</h3>
            <p className="text-[13px] text-gray-500 max-w-md">Tidak ada data kategori yang ditemukan. Silakan tambahkan kategori baru.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-24">ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nama Kategori</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {objectTypes.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-gray-500">#{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDeleteOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ml-2"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsAddOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <h3 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0A356A]" />
                Tambah Kategori Aset
              </h3>
            </div>
            
            <form onSubmit={handleAdd}>
              <div className="mb-6">
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Nama Kategori <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Contoh: Valve, Rotating Equipment, dsb." 
                  className="w-full px-3 py-2.5 text-[13px] bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)} 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-70"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newItemName.trim()}
                  className="px-5 py-2.5 bg-[#0A356A] text-white rounded-md text-[13px] font-semibold hover:bg-[#0556B3] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSubmitting ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus (Konfirmasi Cascade Delete) */}
      {isDeleteOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsDeleteOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">Hapus Kategori Aset?</h3>
            
            <p className="text-[13px] text-gray-600 mb-5 leading-relaxed">
              Anda akan menghapus kategori <span className="font-bold text-gray-900">"{selectedItem.name}"</span>. 
              <br/><br/>
              <span className="bg-red-50 text-red-700 font-semibold px-2 py-1 rounded text-[12px] inline-block mb-1">Peringatan (ON DELETE CASCADE):</span><br/>
              Jika Anda menghapusnya, <strong className="text-red-600">seluruh data peralatan/aset</strong> yang terhubung dengan kategori ini juga akan ikut terhapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="flex items-center gap-3 w-full justify-center mt-2">
              <button 
                onClick={() => setIsDeleteOpen(false)} 
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-colors w-full disabled:opacity-70"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#dc2626] text-white rounded-md text-[13px] font-semibold hover:bg-[#b91c1c] transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-70"
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
