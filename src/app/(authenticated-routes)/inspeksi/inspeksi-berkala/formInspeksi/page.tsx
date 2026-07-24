"use client";

import React, { useState, useRef, useEffect } from "react";
import { Save, Info, AlertCircle, Camera, CheckCircle2, ChevronLeft, Loader2, Wrench, FileText, DollarSign, X, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createInspection } from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";

export default function FormInspeksiBerkalaPage() {
  const searchParams = useSearchParams();
  const eqId = searchParams.get('equipmentId') || "";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Initial Form Data matching EquipmentInspection API Payload
  const [formData, setFormData] = useState({
    equipmentId: eqId,
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectorId: "",
    mechanicalCondition: "",
    electricalCondition: "",
    requireActionId: "",
    refurbishCost: "",
    notes: ""
  });

  useEffect(() => {
    async function fetchUser() {
      const res = await getCurrentUserAction();
      if (res.status && res.user) {
        setFormData(prev => ({ ...prev, inspectorId: String(res.user.id || '') }));
      }
    }
    fetchUser();
    
    if (eqId) {
      setFormData(prev => ({ ...prev, equipmentId: eqId }));
    }
  }, [eqId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === "equipmentId" && value.length > 50) {
      value = value.slice(0, 50);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`File Anda lebih dari 5MB.`);
        setPhoto(null);
        return;
      }
      setFileError(null);
      setPhoto(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = new FormData();
    payload.append("equipment_id", formData.equipmentId);
    payload.append("inspector", formData.inspectorId);
    payload.append("require_action_id", formData.requireActionId);
    payload.append("mechanical_condition", formData.mechanicalCondition);
    payload.append("electrical_condition", formData.electricalCondition);
    payload.append("estimated_refurbish_cost", formData.refurbishCost || "0");
    payload.append("notes", formData.notes);
    
    if (photo) {
      payload.append("photo", photo);
    }

    const res = await createInspection(payload);
    setIsSubmitting(false);

    if (res.success) {
      alert("Berhasil! Laporan inspeksi fisik telah disimpan ke database.");
      router.push("/inspeksi/manajemen");
    } else {
      alert("Gagal menyimpan inspeksi: " + (res.message || "Terjadi kesalahan."));
    }
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
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID ASET (EQUIPMENT ID) <span className="text-red-500">*</span></label>
                  <span className="text-[9px] text-gray-400 font-medium">Contoh: 1</span>
                </div>
                <input required readOnly maxLength={50} type="text" name="equipmentId" value={formData.equipmentId} onChange={handleChange} placeholder="Otomatis terisi..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TANGGAL INSPEKSI <span className="text-red-500">*</span></label>
                <input required type="date" name="inspectionDate" value={formData.inspectionDate} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ID INSPEKTUR <span className="text-red-500">*</span></label>
                <input required readOnly type="text" name="inspectorId" value={formData.inspectorId} onChange={handleChange} placeholder="Otomatis dari user..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none transition-all" />
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
                    <option value="bagus">Bagus (Siap Digunakan)</option>
                    <option value="rusak ringan">Rusak Ringan (Perlu Servis Minor)</option>
                    <option value="rusak berat">Rusak Berat (Perlu Overhaul)</option>
                    <option value="tidak layak">Tidak Layak (Scrap)</option>
                  </select>
                </div>
              </div>

              {/* Elektrikal & Instrumen */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start pb-5">
                <div className="sm:col-span-1">
                  <label className="text-sm font-bold text-gray-800">Kondisi Elektrikal/Instrumen <span className="text-red-500">*</span></label>
                  <p className="text-xs text-gray-500 mt-1">Status kabel, panel, sensor.</p>
                </div>
                <div className="sm:col-span-3">
                  <select required name="electricalCondition" value={formData.electricalCondition} onChange={handleChange} className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all bg-white ${!formData.electricalCondition ? 'text-gray-400' : 'text-gray-900'}`}>
                    <option value="" disabled>Pilih Kondisi Elektrikal...</option>
                    <option value="bagus">Bagus (Berfungsi Normal)</option>
                    <option value="rusak ringan">Rusak Ringan (Perlu Penggantian Part Kecil)</option>
                    <option value="rusak berat">Rusak Berat (Korslet / Terbakar)</option>
                    <option value="tidak layak">Tidak Layak / Hilang</option>
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
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept=".jpg,.jpeg,.png"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-blue-50/40 hover:border-[#0556B3] cursor-pointer transition-all min-h-[120px] bg-gray-50/30 relative overflow-hidden"
                >
                  {photo ? (
                    <div className="absolute inset-0 w-full h-full p-2">
                      <div className="relative w-full h-full border border-gray-200 rounded-lg overflow-hidden group">
                        <img src={URL.createObjectURL(photo)} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPhoto(null); }}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-gray-900">Pilih Foto</span>
                      <span className="text-[10px] text-gray-500 mt-1">Format JPG/PNG maks 5MB</span>
                    </>
                  )}
                </div>
                {fileError && <p className="text-[10px] text-red-500 mt-1.5 font-medium">* {fileError}</p>}
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
