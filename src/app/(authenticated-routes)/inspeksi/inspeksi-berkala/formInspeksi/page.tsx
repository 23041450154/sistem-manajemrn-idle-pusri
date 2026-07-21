"use client";

import React, { useState } from "react";
import { Save, Info, AlertCircle, Camera, CheckCircle2, ChevronLeft, Loader2, Wrench, FileText, DollarSign } from "lucide-react";
import Link from "next/link";

export default function FormInspeksiBerkalaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Form Data matching EquipmentInspection concept
  const [formData, setFormData] = useState({
    equipmentCode: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectorName: "",
    mechanicalCondition: "",
    electricalCondition: "",
    physicalCondition: "",
    requireActionId: "",
    refurbishCost: "",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulasi proses penyimpanan data ke database
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Berhasil! Laporan inspeksi fisik telah disimpan ke database: \n\n" + JSON.stringify(formData, null, 2));
    }, 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-8 pt-2 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
        <div>
          <Link href="/inspeksi/manajemen" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0A356A] transition-colors mb-2.5">
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">Form Inspeksi Fisik Berkala</h1>
          <p className="text-gray-500 text-sm mt-0.5">Isi laporan kondisi aktual peralatan idle di lapangan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* PANEL KIRI: Data Peralatan & Evaluasi Kondisi (Lebar 8 Kolom) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Section 1: Identitas Inspeksi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
              <Info className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Identitas Inspeksi</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">KODE ASET / TAG <span className="text-red-500">*</span></label>
                <input required type="text" name="equipmentCode" value={formData.equipmentCode} onChange={handleChange} placeholder="Contoh: P-102-MKN" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TANGGAL INSPEKSI <span className="text-red-500">*</span></label>
                <input required type="date" name="inspectionDate" value={formData.inspectionDate} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NAMA INSPEKTUR <span className="text-red-500">*</span></label>
                <input required type="text" name="inspectorName" value={formData.inspectorName} onChange={handleChange} placeholder="Nama Anda" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* Section 2: Evaluasi Kondisi Fisik */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
              <Wrench className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Evaluasi Kondisi Aktual</h2>
            </div>
            
            <div className="p-5 space-y-5">
              {/* Mekanikal */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start border-b border-gray-100 pb-5">
                <div className="sm:col-span-1">
                  <label className="text-sm font-bold text-gray-800">Kondisi Mekanikal <span className="text-red-500">*</span></label>
                  <p className="text-xs text-gray-500 mt-1">Status housing, poros, bearing, dll.</p>
                </div>
                <div className="sm:col-span-3">
                  <select required name="mechanicalCondition" value={formData.mechanicalCondition} onChange={handleChange} className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all bg-white ${!formData.mechanicalCondition ? 'text-gray-400' : 'text-gray-900'}`}>
                    <option value="" disabled>Pilih Kondisi Mekanikal...</option>
                    <option value="BAIK">Baik (Siap Digunakan)</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan (Perlu Servis Minor)</option>
                    <option value="RUSAK_BERAT">Rusak Berat (Perlu Overhaul)</option>
                    <option value="TIDAK_LAYAK">Tidak Layak (Scrap)</option>
                  </select>
                </div>
              </div>

              {/* Elektrikal & Instrumen */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start border-b border-gray-100 pb-5">
                <div className="sm:col-span-1">
                  <label className="text-sm font-bold text-gray-800">Kondisi Elektrikal/Instrumen <span className="text-red-500">*</span></label>
                  <p className="text-xs text-gray-500 mt-1">Status kabel, panel, sensor.</p>
                </div>
                <div className="sm:col-span-3">
                  <select required name="electricalCondition" value={formData.electricalCondition} onChange={handleChange} className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all bg-white ${!formData.electricalCondition ? 'text-gray-400' : 'text-gray-900'}`}>
                    <option value="" disabled>Pilih Kondisi Elektrikal...</option>
                    <option value="BAIK">Baik (Berfungsi Normal)</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan (Perlu Penggantian Part Kecil)</option>
                    <option value="RUSAK_BERAT">Rusak Berat (Korslet / Terbakar)</option>
                    <option value="TIDAK_LAYAK">Tidak Layak / Hilang</option>
                    <option value="TIDAK_ADA">Tidak Ada Komponen Elektrikal</option>
                  </select>
                </div>
              </div>

              {/* Fisik Eksternal */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                <div className="sm:col-span-1">
                  <label className="text-sm font-bold text-gray-800">Fisik Eksternal & Preservasi <span className="text-red-500">*</span></label>
                  <p className="text-xs text-gray-500 mt-1">Korosi, cat, kebersihan.</p>
                </div>
                <div className="sm:col-span-3">
                  <select required name="physicalCondition" value={formData.physicalCondition} onChange={handleChange} className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all bg-white ${!formData.physicalCondition ? 'text-gray-400' : 'text-gray-900'}`}>
                    <option value="" disabled>Pilih Kondisi Eksternal...</option>
                    <option value="BAIK">Sangat Baik (Preservasi Terjaga)</option>
                    <option value="KOROSI_RINGAN">Korosi Ringan / Cat Mengelupas</option>
                    <option value="KOROSI_BERAT">Korosi Berat (Perlu Sandblasting)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: Kesimpulan, Biaya & Foto (Lebar 4 Kolom) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
              <FileText className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Kesimpulan Inspeksi</h2>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-4">
              
              {/* Tindakan Lanjutan */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">TINDAKAN YANG DIPERLUKAN <span className="text-red-500">*</span></label>
                <select required name="requireActionId" value={formData.requireActionId} onChange={handleChange} className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all bg-white ${!formData.requireActionId ? 'text-gray-400' : 'text-gray-900'}`}>
                  <option value="" disabled>Pilih Rekomendasi Tindakan...</option>
                  <option value="1">Lanjutkan Preservasi Rutin</option>
                  <option value="2">Perbaikan Ringan di Tempat</option>
                  <option value="3">Tarik ke Bengkel / Overhaul</option>
                  <option value="4">Scrapping / Pemutihan</option>
                </select>
              </div>

              {/* Estimasi Biaya */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">ESTIMASI BIAYA REFURBISH</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">Rp</span>
                  </div>
                  <input type="number" name="refurbishCost" value={formData.refurbishCost} onChange={handleChange} placeholder="0" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Kosongkan jika kondisi baik atau scrap.</p>
              </div>

              {/* Catatan Bebas */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">CATATAN TEMUAN <span className="text-red-500">*</span></label>
                <textarea required name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="Jelaskan detail kerusakan atau temuan anomali..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all resize-none"></textarea>
              </div>

              {/* Upload Foto */}
              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">FOTO KONDISI AKTUAL</label>
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-blue-50/40 hover:border-[#0556B3] cursor-pointer transition-all min-h-[120px] bg-gray-50/30">
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs font-bold text-gray-900">Ambil Foto / Unggah</span>
                  <span className="text-[10px] text-gray-500 mt-1">Format JPG/PNG maks 5MB</span>
                </div>
              </div>
              
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-1">
            <Link href="/inspeksi/manajemen" className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-5 py-2.5 rounded-lg bg-[#0A356A] hover:bg-[#0556B3] text-white text-sm font-bold transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? "Menyimpan Data..." : "Simpan Inspeksi"}
            </button>
          </div>

        </div>
      </form>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100">
            <Loader2 className="w-12 h-12 text-[#0556B3] animate-spin mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Menyimpan Laporan...</h2>
            <p className="text-sm text-gray-500 mt-1">Sistem sedang memproses hasil inspeksi.</p>
          </div>
        </div>
      )}
    </div>
  );
}
