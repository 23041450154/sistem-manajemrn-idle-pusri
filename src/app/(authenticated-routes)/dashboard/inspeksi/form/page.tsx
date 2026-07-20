"use client";

import React, { useState } from "react";
import { 
  CheckCircle, 
  Wrench, 
  AlertTriangle, 
  Lightbulb, 
  Camera, 
  Save, 
  Clock, 
  FileText, 
  ChevronRight,
  Loader2,
  X
} from "lucide-react";
import Link from "next/link";

export default function InspeksiFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    inspectionDate: "2023-10-27",
    condition: "ready", // ready, repair, damaged
    technicalNotes: "",
    recommendation: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Hasil inspeksi berhasil disimpan secara aman!");
    }, 2000); // 2 second mock delay for loading UI
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 pt-2 relative">
      
      {/* Breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-[#0556B3] transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="hover:text-[#0556B3] transition-colors cursor-pointer">Inspeksi</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-bold text-gray-900">Formulir Inspeksi</span>
        </div>
      </div>

      {/* KARTU 1: DETAIL ASET */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
            <h2 className="text-lg font-bold text-[#0A356A]">Detail Aset</h2>
          </div>
          <span className="bg-[#0556B3] text-white text-[11px] font-bold px-4 py-1.5 rounded-full tracking-wider">
            STATUS: IDLE
          </span>
        </div>
        
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">NAMA ASET</label>
            <p className="text-base font-semibold text-[#0556B3]">Centrifugal Pump P-102A</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">NOMOR TAG</label>
            <p className="text-base font-semibold text-gray-900">EQP-7729-IDL</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">LOKASI</label>
            <p className="text-base font-semibold text-gray-900">Gudang Material L-04</p>
          </div>
        </div>
      </div>

      {/* KARTU 2: FORM HASIL INSPEKSI */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">Data Hasil Inspeksi</h2>
        </div>
        
        <div className="p-5 sm:p-7 flex flex-col gap-7">
          
          {/* Row 1: Date & Condition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Tanggal */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2.5 block">Tanggal Inspeksi</label>
              <input 
                type="date" 
                value={formData.inspectionDate}
                onChange={(e) => setFormData({...formData, inspectionDate: e.target.value})}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0556B3] focus:border-[#0556B3] outline-none transition-all font-medium text-gray-800"
              />
            </div>

            {/* Condition Cards */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2.5 block">Kondisi Saat Ini</label>
              <div className="grid grid-cols-3 gap-3">
                {/* Ready */}
                <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.condition === 'ready' ? 'border-[#0556B3] bg-blue-50/50 ring-1 ring-[#0556B3]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="condition" value="ready" checked={formData.condition === 'ready'} onChange={() => setFormData({...formData, condition: 'ready'})} className="hidden" />
                  <CheckCircle className={`w-5 h-5 mb-1.5 ${formData.condition === 'ready' ? 'text-[#0556B3]' : 'text-gray-400'}`} />
                  <span className={`text-xs font-bold ${formData.condition === 'ready' ? 'text-[#0A356A]' : 'text-gray-600'}`}>Ready to Use</span>
                </label>
                
                {/* Repair */}
                <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.condition === 'repair' ? 'border-[#B45309] bg-orange-50/50 ring-1 ring-[#B45309]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="condition" value="repair" checked={formData.condition === 'repair'} onChange={() => setFormData({...formData, condition: 'repair'})} className="hidden" />
                  <Wrench className={`w-5 h-5 mb-1.5 ${formData.condition === 'repair' ? 'text-[#B45309]' : 'text-gray-400'}`} />
                  <span className={`text-xs font-bold ${formData.condition === 'repair' ? 'text-[#92400E]' : 'text-gray-600'}`}>Needs Repair</span>
                </label>

                {/* Damaged */}
                <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.condition === 'damaged' ? 'border-[#B91C1C] bg-red-50/50 ring-1 ring-[#B91C1C]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="condition" value="damaged" checked={formData.condition === 'damaged'} onChange={() => setFormData({...formData, condition: 'damaged'})} className="hidden" />
                  <AlertTriangle className={`w-5 h-5 mb-1.5 ${formData.condition === 'damaged' ? 'text-[#B91C1C]' : 'text-gray-400'}`} />
                  <span className={`text-xs font-bold ${formData.condition === 'damaged' ? 'text-[#991B1B]' : 'text-gray-600'}`}>Damaged</span>
                </label>
              </div>
            </div>

          </div>

          {/* Catatan Teknis */}
          <div>
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2.5 block">Catatan Teknis</label>
            <textarea 
              value={formData.technicalNotes}
              onChange={(e) => setFormData({...formData, technicalNotes: e.target.value})}
              placeholder="Tuliskan temuan teknis secara detail (e.g. kebocoran seal, korosi permukaan)..." 
              rows={4} 
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0556B3] outline-none transition-all resize-none text-gray-800"
            ></textarea>
          </div>

          {/* Rekomendasi Tindakan */}
          <div>
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2.5 block">Rekomendasi Tindakan</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lightbulb className="w-5 h-5" />
              </span>
              <input 
                type="text" 
                value={formData.recommendation}
                onChange={(e) => setFormData({...formData, recommendation: e.target.value})}
                placeholder="Misal: Penggantian bearing seri 6205, Pembersihan karat..." 
                className="w-full pl-12 pr-4 py-3.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0556B3] outline-none transition-all text-gray-800"
              />
            </div>
          </div>

          {/* Upload Foto Kondisi */}
          <div>
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2.5 block">Upload Foto Kondisi</label>
            <div className="flex gap-4 overflow-x-auto pb-2">
              
              {/* Add Button */}
              <button type="button" className="shrink-0 w-44 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-[#0556B3] hover:bg-blue-50/30 transition-all text-gray-400 hover:text-[#0556B3]">
                <Camera className="w-7 h-7 mb-1" />
                <span className="text-xs font-bold text-gray-700">Tambah Foto</span>
                <span className="text-[10px] text-gray-500">JPG, PNG (Max 5MB)</span>
              </button>

              {/* Photo 1 (Mock) */}
              <div className="shrink-0 w-44 h-32 rounded-xl overflow-hidden relative group border border-gray-200 bg-gray-100">
                {/* Menggunakan URL ilustrasi asli dari mesin industri */}
                <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80" alt="Pump" className="w-full h-full object-cover" />
                <button type="button" className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Photo 2 (Mock) */}
              <div className="shrink-0 w-44 h-32 rounded-xl overflow-hidden relative group border border-gray-200 bg-gray-100">
                <img src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80" alt="Gauges" className="w-full h-full object-cover" />
                <button type="button" className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Empty Slot */}
              <div className="shrink-0 w-44 h-32 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                <span className="text-xs text-gray-400 font-medium">Belum ada foto lain</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-2"></div>
          
          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard" className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
              Batal
            </Link>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-[#0A356A] hover:bg-[#0556B3] text-white text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? "Menyimpan Data..." : "Simpan Hasil Inspeksi"}
            </button>
          </div>

        </div>
      </form>

      {/* KARTU 3: RIWAYAT INSPEKSI TERAKHIR */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-5">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/30 rounded-t-xl">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Riwayat Inspeksi Terakhir</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100/50 flex items-center justify-center text-[#0556B3]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Inspeksi Rutin Q3</h4>
                <p className="text-xs text-gray-500 mt-0.5">15 Juli 2023 oleh Budi Santoso</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1.5 rounded-md tracking-wider">
              NORMAL
            </span>
          </div>
        </div>
      </div>

      {/* FULLSCREEN SPINNER OVERLAY (Animasi Muter-Muter Saat Menyimpan) */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100">
            <Loader2 className="w-12 h-12 text-[#0556B3] animate-spin mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Menyimpan Hasil Inspeksi...</h2>
            <p className="text-sm text-gray-500 mt-1">Mengunggah foto dan sinkronisasi ke server</p>
          </div>
        </div>
      )}

    </div>
  );
}
