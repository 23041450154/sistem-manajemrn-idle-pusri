"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, XCircle, Loader2, Database, Tag, Pencil, Eye, Search } from "lucide-react";
import { getObjectTypes, createObjectType, deleteObjectType } from "@/action/api";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EditMasterDialog } from "@/components/EditMasterDialog";
import { DetailMasterDialog } from "@/components/DetailMasterDialog";

export default function KategoriAsetPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [editItem, setEditItem] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [detailItem, setDetailItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [itemName, setItemName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await getObjectTypes();
      setData(result || []);
    } catch (error) {
      console.error("Fetch object types error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = searchQuery.trim()
    ? data.filter(item => item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : data;

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setIsSubmitting(true);
    const res = await createObjectType(itemName);
    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menambahkan kategori aset baru!" });
      setItemName("");
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
    const res = await deleteObjectType(selectedItem.id);
    setIsSubmitting(false);

    if (res.success) {
      setNotification({ type: "success", message: "Berhasil menghapus kategori aset!" });
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: "error", message: "Gagal menghapus data: " + (res.message || "Pastikan tidak ada data yang terkait.") });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEditSaved = (updatedItem: any) => {
    setData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setNotification({ type: "success", message: "Berhasil memperbarui kategori aset!" });
    setTimeout(() => setNotification(null), 3000);
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
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Master Data — Kategori Aset
            </h1>
            <p className="text-xs text-blue-200/90 mt-0.5 font-medium max-w-xl">
              Klasifikasi jenis dan tipe peralatan pabrik untuk inventaris &amp; laporan.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setItemName("");
            setIsAddOpen(true);
          }}
          className="bg-white hover:bg-blue-50 active:scale-[0.98] text-[#0A356A] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Aset</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kategori aset..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-[#0A356A] animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500">Memuat data kategori aset...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-[#0A356A] rounded-2xl flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Data Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md">Tidak ada data kategori aset yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[80px]">ID</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Entri</th>
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors h-[48px]">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-mono font-medium text-slate-500">#{item.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-slate-900 truncate">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-[#0A356A] flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </span>
                        <span className="truncate">{item.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center w-[120px]">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content="Detail">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDetailItem(item); setIsDetailOpen(true); }}
                            className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditItem(item); setIsEditOpen(true); }}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Hapus">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredData.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan {filteredData.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length} data
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

      {/* Modal Tambah */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitting && setIsAddOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#0A356A]" />
                Tambah Kategori Aset Baru
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
                  placeholder="Contoh: Valve, Rotating Equipment"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] focus:bg-white outline-none transition-all font-medium"
                />
              </div>

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

      {/* Dialog Detail Master */}
      <DetailMasterDialog
        open={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailItem(null); }}
        onEdit={() => {
          const itemToEdit = detailItem;
          setIsDetailOpen(false);
          setDetailItem(null);
          setEditItem(itemToEdit);
          setIsEditOpen(true);
        }}
        item={detailItem}
        activeTab="objectTypes"
      />

      {/* Dialog Edit Master */}
      <EditMasterDialog
        open={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditItem(null); }}
        onSaved={handleEditSaved}
        item={editItem}
        activeTab="objectTypes"
      />

      {/* Dialog Hapus Master */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedItem(null); }}
        onConfirm={handleDelete}
        title="Hapus Data"
        description="Apakah Anda yakin ingin menghapus data ini?"
        isDeleting={isSubmitting}
      />
    </div>
  );
}
