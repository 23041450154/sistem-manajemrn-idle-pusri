"use client";

import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, CheckCircle2, XCircle, Loader2, Database, Search } from "lucide-react";
import { getEquipments, deleteEquipment } from "@/action/api";

export default function EquipmentManagementPage() {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [notification, setNotification] = useState<{type: "success"|"error", message: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getEquipments();
      setEquipments(data);
      setFilteredEquipments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredEquipments(equipments);
    } else {
      const query = search.toLowerCase();
      const filtered = equipments.filter((eq) => 
        eq.equipment_code?.toLowerCase().includes(query) ||
        eq.name?.toLowerCase().includes(query) ||
        eq.plant?.toLowerCase().includes(query)
      );
      setFilteredEquipments(filtered);
    }
  }, [search, equipments]);

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    const res = await deleteEquipment(selectedItem.id);
    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menghapus data aset!" });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "Gagal menghapus aset: " + (res.message || "Silakan coba lagi.") });
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
            Manajemen Aset / Peralatan
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">Kelola dan hapus data aset yang telah diregistrasi ke dalam sistem.</p>
        </div>
      </div>

      {/* Pencarian */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan kode, nama, atau plant..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50 border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabel Aset */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-500">Memuat data aset...</p>
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Database className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Data Tidak Ditemukan</h3>
            <p className="text-[13px] text-gray-500 max-w-md">Tidak ada aset yang terdaftar atau cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kode Aset</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nama Peralatan</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Plant</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredEquipments.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-bold text-[#0A356A]">{item.equipment_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-medium text-gray-600">{item.plant}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[11px] font-bold">
                        {item.status?.name || "REGISTERED"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDeleteOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ml-2"
                        title="Hapus Aset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Hapus (Konfirmasi) */}
      {isDeleteOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsDeleteOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">Konfirmasi Penghapusan</h3>
            
            <p className="text-[13px] text-gray-600 mb-5 leading-relaxed">
              Anda akan menghapus data aset <span className="font-bold text-gray-900">"{selectedItem.equipment_code} - {selectedItem.name}"</span>. 
              <br/><br/>
              Tindakan ini akan menghapus aset ini dari sistem secara permanen beserta data *approval* atau inspeksi yang terkait dengannya. Tindakan ini tidak dapat dibatalkan.
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
                {isSubmitting ? "Menghapus..." : "Ya, Hapus Aset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
