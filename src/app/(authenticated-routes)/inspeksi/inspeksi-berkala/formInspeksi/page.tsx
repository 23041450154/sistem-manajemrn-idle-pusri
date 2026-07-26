"use client";

import React, { useState, useRef, useEffect } from "react";
import { Save, Info, AlertCircle, Camera, CheckCircle2, ChevronLeft, Loader2, Wrench, FileText, DollarSign, X, UploadCloud, User, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createInspection, getEquipments } from "@/action/api";
import { getCurrentUserAction } from "@/action/auth";

function FormInspeksiBerkalaContent() {
  const searchParams = useSearchParams();
  const eqId = searchParams.get('equipmentId') || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<{type: "success" | "error", message: string} | null>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // User Info
  const [userInfo, setUserInfo] = useState<{ id: string, name: string, npp: string }>({ id: "", name: "", npp: "" });
  
  const [equipmentInfo, setEquipmentInfo] = useState({ 
    name: "", code: "", plant: "", funcLoc: "", objectType: "", vendor: "", year: "", storageLocation: "", photo: "" 
  });

  // Initial Form Data matching EquipmentInspection API Payload
  const [formData, setFormData] = useState({
    equipmentId: eqId,
    inspectionDate: "",
    inspectorId: "",
    mechanicalCondition: "",
    electricalCondition: "",
    requireActionId: "",
    refurbishCost: "",
    notes: ""
  });

  useEffect(() => {
    async function fetchData() {
      // Set initial date on client to avoid hydration mismatch
      setFormData(prev => ({ ...prev, inspectionDate: new Date().toISOString().split("T")[0] }));

      // Fetch User Info
      const res = await getCurrentUserAction();
      if (res.status && res.user) {
        setUserInfo({
          id: String(res.user.id || ''),
          name: res.user.name || '-',
          npp: res.user.npp || '-'
        });
        setFormData(prev => ({ ...prev, inspectorId: String(res.user.id || '') }));
      }

      // Fetch Equipment Info
      if (eqId) {
        setFormData(prev => ({ ...prev, equipmentId: eqId }));
        const equipments = await getEquipments();
        const eq = equipments.find((e: any) => String(e.id) === eqId);
        if (eq) {
          setEquipmentInfo({
            name: eq.name || '-',
            code: eq.equipment_code || '-',
            plant: eq.plant || '-',
            funcLoc: eq.func_loc || '-',
            objectType: eq.object_type?.name || '-',
            vendor: eq.vendor || '-',
            year: eq.year || '-',
            storageLocation: eq.storage_location?.name || '-',
            photo: eq.photo_url || eq.photo || ''
          });
        }
      }
    }
    fetchData();
  }, [eqId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === "equipmentId" && value.length > 50) {
      value = value.slice(0, 50);
    }
    
    // Auto-format currency untuk input biaya refurbish
    if (name === "refurbishCost") {
      const rawValue = value.replace(/\D/g, "");
      value = rawValue ? parseInt(rawValue, 10).toLocaleString('id-ID') : "";
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    // Hapus error form jika field diisi
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
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
    
    // Validasi Manual
    const errors: Record<string, string> = {};
    if (!formData.inspectionDate) errors.inspectionDate = "Harap isi tanggal inspeksi.";
    if (!formData.mechanicalCondition) errors.mechanicalCondition = "Harap pilih kondisi mekanikal.";
    if (!formData.electricalCondition) errors.electricalCondition = "Harap pilih kondisi elektrikal.";
    if (!formData.requireActionId) errors.requireActionId = "Harap pilih rekomendasi tindakan lanjutan.";
    if (!formData.notes) errors.notes = "Harap isi catatan temuan.";
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setSubmitStatus({ type: "error", message: "Mohon lengkapi semua isian yang wajib (ditandai bintang merah)." });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = new FormData();
    payload.append("equipment_id", formData.equipmentId);
    payload.append("inspector", formData.inspectorId);
    payload.append("require_action_id", formData.requireActionId);
    payload.append("mechanical_condition", formData.mechanicalCondition);
    payload.append("electrical_condition", formData.electricalCondition);
    
    // Hapus format titik pada currency sebelum dikirim ke API
    const cleanRefurbishCost = formData.refurbishCost ? formData.refurbishCost.replace(/\./g, "") : "0";
    payload.append("estimated_refurbish_cost", cleanRefurbishCost);
    
    payload.append("notes", formData.notes);
    
    if (photo) {
      payload.append("photo", photo);
    }

    const res = await createInspection(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitStatus({ type: "success", message: "Laporan inspeksi fisik berhasil disimpan! Mengalihkan..." });
      setTimeout(() => {
        router.push("/inspeksi/manajemen");
      }, 1500);
    } else {
      setSubmitStatus({ type: "error", message: "Gagal menyimpan inspeksi: " + (res.message || "Terjadi kesalahan.") });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-8 pt-2 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
        <div>
          <Link href="/inspeksi/manajemen" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0A356A] transition-colors mb-2.5">
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">Form Inspeksi Fisik Berkala</h1>
          <p className="text-gray-500 text-sm mt-0.5">Isi laporan kondisi aktual peralatan idle di lapangan secara lengkap.</p>
        </div>
      </div>

      {submitStatus && (
        <div className={`p-4 rounded-lg mb-5 flex items-start gap-3 border shadow-sm ${submitStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {submitStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
          <div className="text-sm font-semibold pt-0.5">{submitStatus.message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-5">
        
        {/* Informasi Registrasi (Rendal) */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-500" />
              <h3 className="text-[12px] font-bold text-gray-800">Informasi Equipment</h3>
            </div>
            {/* Tanggal Inspeksi Input */}
            <div className={`flex items-center gap-2 px-2.5 py-1 border rounded-md shadow-sm transition-colors ${formErrors.inspectionDate ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
              <Calendar className={`w-3.5 h-3.5 ${formErrors.inspectionDate ? 'text-red-500' : 'text-gray-500'}`} />
              <span className={`text-[11px] font-bold hidden sm:inline ${formErrors.inspectionDate ? 'text-red-700' : 'text-gray-600'}`}>Tanggal Inspeksi:</span>
              <input type="date" name="inspectionDate" value={formData.inspectionDate} onChange={handleChange} className={`px-1 text-[11px] font-semibold border-none bg-transparent focus:ring-0 outline-none p-0 h-auto cursor-pointer ${formErrors.inspectionDate ? 'text-red-800' : 'text-gray-800'}`} />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Kode Aset / Tag</span>
                <span className="text-[12px] font-bold text-[#0A356A]">{equipmentInfo.code || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Nama Peralatan</span>
                <span className="text-[12px] font-medium text-gray-900">{equipmentInfo.name || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Kategori (Tipe)</span>
                <span className="text-[12px] font-medium text-gray-900">{equipmentInfo.objectType || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Lokasi Penyimpanan</span>
                <span className="text-[12px] font-medium text-gray-900">{equipmentInfo.storageLocation || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Pabrik / Plant</span>
                <span className="text-[12px] font-medium text-gray-900">{equipmentInfo.plant || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Area (FuncLoc)</span>
                <span className="text-[12px] font-medium text-gray-900">{equipmentInfo.funcLoc || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Vendor / Merk</span>
                <span className="text-[12px] font-medium text-gray-900">{equipmentInfo.vendor || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Tahun Dibuat</span>
                <span className="text-[12px] font-medium text-gray-900">{equipmentInfo.year || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">Inspektur</span>
                <span className="text-[12px] font-bold text-[#0A356A]">{userInfo.name || "Inspektur"}</span>
              </div>
            </div>
            
            {/* Foto Registrasi */}
            <div className="w-full md:w-56 shrink-0 flex flex-col gap-2 md:border-l md:border-gray-100 md:pl-4">
              <span className="text-[10px] font-semibold text-gray-500 uppercase block">Foto Registrasi</span>
              <div className="flex gap-2">
                <div 
                  className="h-16 flex-1 bg-gray-100 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors shadow-sm flex items-center justify-center relative"
                  onClick={() => equipmentInfo.photo && window.open(equipmentInfo.photo, "_blank")}
                  title={equipmentInfo.photo ? "Lihat Foto Mesin" : "Foto Mesin Belum Ada"}
                >
                  {equipmentInfo.photo ? (
                    <img src={equipmentInfo.photo} alt={equipmentInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                      <Wrench className="w-5 h-5 opacity-40 mb-1" strokeWidth={1.5} />
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center leading-tight">Foto<br/>Mesin</span>
                    </div>
                  )}
                </div>
                
                <div 
                  className="h-16 flex-1 bg-gray-100 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors shadow-sm flex items-center justify-center relative"
                  title="Foto Nameplate/Plat"
                >
                  {/* Nameplate photo placeholder or real data if available */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <FileText className="w-5 h-5 opacity-40 mb-1" strokeWidth={1.5} />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 text-center leading-tight">Foto<br/>Plat</span>
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-gray-400 italic text-center md:text-left mt-0.5">Klik foto untuk memperbesar</span>
            </div>
          </div>
        </div>
        
        {/* Konten Utama Inspeksi (Split 2 Columns) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* KIRI: Evaluasi Fisik */}
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
              <Wrench className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Evaluasi Kondisi Aktual</h2>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-6">
              {/* Mekanikal */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-bold text-gray-800 block">Kondisi Mekanikal <span className="text-red-500">*</span></label>
                  <p className="text-[11px] text-gray-500 leading-snug">Status housing, poros, bearing, struktur mekanis lainnya.</p>
                </div>
                <select name="mechanicalCondition" value={formData.mechanicalCondition} onChange={handleChange} className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-1 outline-none transition-all ${formErrors.mechanicalCondition ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/30' : 'border-gray-300 focus:border-[#0556B3] focus:ring-[#0556B3]/20'} ${!formData.mechanicalCondition ? 'text-gray-400' : 'text-gray-900'}`}>
                  <option value="" disabled>Pilih Kondisi Mekanikal...</option>
                  <option value="bagus">Bagus (Siap Digunakan)</option>
                  <option value="rusak ringan">Rusak Ringan (Perlu Servis Minor)</option>
                  <option value="rusak berat">Rusak Berat (Perlu Overhaul)</option>
                  <option value="tidak layak">Tidak Layak (Scrap)</option>
                </select>
                {formErrors.mechanicalCondition && (
                  <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {formErrors.mechanicalCondition}</p>
                )}
              </div>

              {/* Elektrikal & Instrumen */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-bold text-gray-800 block">Kondisi Elektrikal/Instrumen <span className="text-red-500">*</span></label>
                  <p className="text-[11px] text-gray-500 leading-snug">Status kabel, panel, sensor, motor listrik.</p>
                </div>
                <select name="electricalCondition" value={formData.electricalCondition} onChange={handleChange} className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-1 outline-none transition-all ${formErrors.electricalCondition ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/30' : 'border-gray-300 focus:border-[#0556B3] focus:ring-[#0556B3]/20'} ${!formData.electricalCondition ? 'text-gray-400' : 'text-gray-900'}`}>
                  <option value="" disabled>Pilih Kondisi Elektrikal...</option>
                  <option value="bagus">Bagus (Berfungsi Normal)</option>
                  <option value="rusak ringan">Rusak Ringan (Part Kecil)</option>
                  <option value="rusak berat">Rusak Berat (Korslet/Terbakar)</option>
                  <option value="tidak layak">Tidak Layak / Hilang</option>
                </select>
                {formErrors.electricalCondition && (
                  <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {formErrors.electricalCondition}</p>
                )}
              </div>

              {/* Upload Foto */}
              <div className="flex-1 flex flex-col space-y-2">
                <div>
                  <label className="text-sm font-bold text-gray-800 block">Foto Aktual</label>
                  <p className="text-[11px] text-gray-500 leading-snug">Lampirkan foto alat yang menunjukkan kondisi saat inspeksi dilakukan (Maks 5MB).</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png" />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex-1 min-h-[140px] border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-blue-50/40 hover:border-[#0556B3] cursor-pointer transition-all bg-gray-50/50 relative overflow-hidden"
                >
                  {photo ? (
                    <div className="absolute inset-0 w-full h-full p-2">
                      <div className="relative w-full h-full rounded-lg overflow-hidden group border border-gray-200">
                        <img src={URL.createObjectURL(photo)} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setPhoto(null); }} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm font-bold text-gray-700">Klik untuk Pilih Foto</span>
                      <span className="text-[11px] text-gray-500 mt-1">Format JPG/PNG</span>
                    </>
                  )}
                </div>
                {fileError && <p className="text-[11px] text-red-500 font-medium">* {fileError}</p>}
              </div>
            </div>
          </div>

          {/* KANAN: Kesimpulan & Biaya */}
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
              <FileText className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Kesimpulan Inspeksi</h2>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-6">
              {/* Tindakan Lanjutan */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 block">Tindakan Lanjutan <span className="text-red-500">*</span></label>
                <select name="requireActionId" value={formData.requireActionId} onChange={handleChange} className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-1 outline-none transition-all ${formErrors.requireActionId ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/30' : 'border-gray-300 focus:border-[#0556B3] focus:ring-[#0556B3]/20'} ${!formData.requireActionId ? 'text-gray-400' : 'text-gray-900'}`}>
                  <option value="" disabled>Pilih Rekomendasi Tindakan...</option>
                  <option value="1">Lanjutkan Preservasi Rutin</option>
                  <option value="2">Perbaikan Ringan di Tempat</option>
                  <option value="3">Tarik ke Bengkel / Overhaul</option>
                  <option value="4">Scrapping / Pemutihan</option>
                </select>
                {formErrors.requireActionId && (
                  <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {formErrors.requireActionId}</p>
                )}
              </div>

              {/* Estimasi Biaya */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-bold text-gray-800 block">Estimasi Biaya Refurbish</label>
                  <p className="text-[11px] text-gray-500 leading-snug">Kosongkan jika kondisi alat baik atau di-scrap.</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">Rp</span>
                  </div>
                  <input type="text" name="refurbishCost" value={formData.refurbishCost} onChange={handleChange} placeholder="0" className="w-full pl-12 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
                </div>
              </div>

              {/* Catatan Bebas */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-bold text-gray-800 block">Catatan Temuan <span className="text-red-500">*</span></label>
                  <p className="text-[11px] text-gray-500 leading-snug">Jelaskan detail kerusakan, temuan anomali, atau alasan pemilihan tindakan.</p>
                </div>
                <textarea name="notes" rows={4} value={formData.notes} onChange={handleChange} placeholder="Tuliskan catatan detail hasil inspeksi..." className={`w-full px-3 py-3 text-sm border rounded-lg focus:ring-1 outline-none transition-all resize-none ${formErrors.notes ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/30' : 'border-gray-300 focus:border-[#0556B3] focus:ring-[#0556B3]/20'}`}></textarea>
                {formErrors.notes && (
                  <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {formErrors.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Full width di bawah) */}
        <div className="flex items-center justify-end gap-3 mt-1 pb-10">
          <Link href="/inspeksi/manajemen" className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[200px] px-6 py-2.5 rounded-lg bg-[#0A356A] hover:bg-[#0556B3] text-white text-sm font-bold transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? "Menyimpan Data..." : "Simpan Inspeksi"}
          </button>
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

export default function FormInspeksiBerkalaPage() {
  return (
    <React.Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-[#0556B3] animate-spin" />
      </div>
    }>
      <FormInspeksiBerkalaContent />
    </React.Suspense>
  );
}
