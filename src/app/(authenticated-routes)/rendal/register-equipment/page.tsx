"use client";

import React, { useState, useEffect, useRef } from "react";
import { Save, Info, AlertCircle, FileSpreadsheet, UploadCloud, CheckCircle2, X, Loader2, ChevronLeft, Paperclip } from "lucide-react";
import Link from "next/link";
import { createEquipment } from "@/action/api";
import { useRouter } from "next/navigation";

export default function RegisterEquipmentPage() {
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // State untuk efek Loading dan Validasi
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isImporting, setIsImporting] = useState(false);

  // Hardcode Object Types (Statis sementara)
  const objectTypes = [
    { id: 1, name: "Rotary Equipment" },
    { id: 2, name: "Static Equipment" },
    { id: 3, name: "Electrical" },
    { id: 4, name: "Instrument" },
    { id: 5, name: "Peralatan Umum" },
    { id: 6, name: "Valve" }
  ];

  // Hardcode Storage Locations (Statis sementara)
  const storageLocations = [
    { id: 1, name: "Gudang Utama P-IIB (Gudang B-12)" },
    { id: 2, name: "Gudang Utama P-III" },
    { id: 3, name: "Yard Terbuka P-IIB" },
    { id: 4, name: "Workshop Mekanik" }
  ];

  // UX Improvement: Semua nilai dropdown & radio di-set kosong ("") di awal
  const [formData, setFormData] = useState({
    equipmentCode: "",
    name: "",
    funcLoc: "",
    plant: "",
    objectTypeId: "",
    vendor: "",
    year: new Date().getFullYear().toString(),
    originalValue: "",
    conditionId: "",
    storageLocationId: "",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    if ((name === "equipmentCode" || name === "name") && value.length > 50) {
      value = value.slice(0, 50);
    }
    
    if (name === "originalValue") {
      const rawValue = value.replace(/\D/g, "");
      value = rawValue ? parseInt(rawValue, 10).toLocaleString('id-ID') : "";
    }
    
    // Jika user mengisi form lain (misal nama), kita anggap equipmentCode otomatis "touched" agar tervalidasi
    setTouched(prev => ({ 
      ...prev, 
      [name]: true,
      ...(name !== "equipmentCode" && !formData.equipmentCode ? { equipmentCode: true } : {})
    }));
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom Validation Check
    if (!formData.equipmentCode || !formData.name || !formData.objectTypeId || !formData.storageLocationId || !formData.plant || !formData.conditionId) {
      setShowValidationErrors(true);
      return;
    }

    setIsSubmitting(true);
    setShowValidationErrors(false);

    const payload = {
      book_value: 0, // as requested in swagger
      equipment_code: formData.equipmentCode,
      func_loc: formData.funcLoc,
      id_condition: Number(formData.conditionId),
      id_object_type: Number(formData.objectTypeId),
      id_storage_location: Number(formData.storageLocationId),
      name: formData.name,
      notes: formData.notes,
      original_value: Number(formData.originalValue.replace(/\./g, "")) || 0,
      plant: formData.plant,
      plant_description: "",
      vendor: formData.vendor,
      year: Number(formData.year) || new Date().getFullYear()
    };

    const res = await createEquipment(payload);
    setIsSubmitting(false);

    if (res.success) {
      alert("Berhasil! Peralatan idle telah didaftarkan.");
      router.push("/rendal/idle");
    } else {
      alert("Gagal menyimpan data: " + (res.message || "Pastikan field sudah sesuai."));
    }
  };

  const conditionLabels: Record<string, string> = {
    "1": "Penyelesaian Proyek",
    "2": "Produksi Berhenti",
    "3": "Rusak / Perlu Servis",
    "4": "Upgrade Teknologi"
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-8 pt-2 relative">

      {/* Header Title & Import */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
        <div>
          <Link href="/rendal/idle" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0A356A] transition-colors mb-2.5">
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-[#0A356A] tracking-tight">Registrasi Peralatan Idle</h1>
          <p className="text-gray-500 text-sm mt-0.5">Daftarkan aset atau peralatan yang saat ini tidak digunakan.</p>
        </div>
        <div className="relative md:mt-8">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm focus:outline-none"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0556B3]" />
            <span>Import Data</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* PANEL KIRI: Data Utama & Spesifikasi (Lebar 7 Kolom) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Judul Panel */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50 rounded-t-xl">
              <Info className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Informasi & Lokasi Aset</h2>
            </div>

            {/* Grid Isian Kiri */}
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">

              {/* Baris 1: Peralatan */}
              <div className="space-y-1.5 lg:col-span-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">KODE ASET / TAG <span className="text-red-500">*</span></label>
                  <span className="text-[9px] text-gray-400 font-medium">Maks 50 karakter</span>
                </div>
                <input onBlur={handleBlur} maxLength={50} type="text" name="equipmentCode" value={formData.equipmentCode} onChange={handleChange} placeholder="P-102-MKN" className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${(showValidationErrors || touched.equipmentCode) && !formData.equipmentCode ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" : "border-gray-300 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`} />
                {(showValidationErrors || touched.equipmentCode) && !formData.equipmentCode && <p className="text-[10px] text-red-500 mt-1 font-medium">* Kode Aset wajib diisi.</p>}
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">NAMA PERALATAN <span className="text-red-500">*</span></label>
                  <span className="text-[9px] text-gray-400 font-medium">Maks 50 karakter</span>
                </div>
                <input onBlur={handleBlur} maxLength={50} type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Contoh: Centrifugal Pump P-102" className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${(showValidationErrors || touched.name) && !formData.name ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" : "border-gray-300 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`} />
                {(showValidationErrors || touched.name) && !formData.name && <p className="text-[10px] text-red-500 mt-1 font-medium">* Nama Peralatan wajib diisi.</p>}
              </div>

              {/* Baris 2: Klasifikasi */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">KATEGORI (TIPE) <span className="text-red-500">*</span></label>
                <select onBlur={handleBlur} name="objectTypeId" value={formData.objectTypeId} onChange={handleChange} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all bg-white ${(showValidationErrors || touched.objectTypeId) && !formData.objectTypeId ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 bg-red-50/10" : !formData.objectTypeId ? "border-gray-300 text-gray-400 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]" : "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}>
                  <option value="" disabled>Pilih Kategori...</option>
                  {objectTypes.map((type: any) => (
                    <option key={type.id} value={type.id} className="text-gray-900">
                      {type.name}
                    </option>
                  ))}
                </select>
                {(showValidationErrors || touched.objectTypeId) && !formData.objectTypeId && <p className="text-[10px] text-red-500 mt-1 font-medium">* Kategori wajib dipilih.</p>}
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">LOKASI PENYIMPANAN <span className="text-red-500">*</span></label>
                <select onBlur={handleBlur} name="storageLocationId" value={formData.storageLocationId} onChange={handleChange} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all bg-white ${(showValidationErrors || touched.storageLocationId) && !formData.storageLocationId ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 bg-red-50/10" : !formData.storageLocationId ? "border-gray-300 text-gray-400 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]" : "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}>
                  <option value="" disabled>Pilih Lokasi Simpan...</option>
                  {storageLocations.map((loc: any) => (
                    <option key={loc.id} value={loc.id} className="text-gray-900">
                      {loc.name}
                    </option>
                  ))}
                </select>
                {(showValidationErrors || touched.storageLocationId) && !formData.storageLocationId && <p className="text-[10px] text-red-500 mt-1 font-medium">* Lokasi penyimpanan wajib dipilih.</p>}
              </div>

              {/* Baris 3: Area */}
              <div className="space-y-1.5 lg:col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PABRIK / PLANT <span className="text-red-500">*</span></label>
                <select onBlur={handleBlur} name="plant" value={formData.plant} onChange={handleChange} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all bg-white ${(showValidationErrors || touched.plant) && !formData.plant ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 bg-red-50/10" : !formData.plant ? "border-gray-300 text-gray-400 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]" : "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"}`}>
                  <option value="" disabled>Pilih Pabrik...</option>
                  <option value="P-IIB" className="text-gray-900">Pusri IIB</option>
                  <option value="P-III" className="text-gray-900">Pusri III</option>
                  <option value="P-IV" className="text-gray-900">Pusri IV</option>
                  <option value="UTILITY" className="text-gray-900">Utility</option>
                </select>
                {(showValidationErrors || touched.plant) && !formData.plant && <p className="text-[10px] text-red-500 mt-1 font-medium">* Pabrik / Plant wajib dipilih.</p>}
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">AREA (FUNCLOC)</label>
                <input type="text" name="funcLoc" value={formData.funcLoc} onChange={handleChange} placeholder="Contoh: Ammonia Area" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] focus:border-[#0556B3] outline-none transition-all" />
              </div>

              {/* Garis Pemisah Visual */}
              <div className="col-span-full border-t border-gray-100 my-1"></div>

              {/* Baris 4: Spesifikasi Khusus */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">VENDOR / MERK</label>
                <input type="text" name="vendor" value={formData.vendor} onChange={handleChange} placeholder="KSB Indonesia" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TAHUN DIBUAT</label>
                <input type="number" name="year" value={formData.year} onChange={handleChange} min="1950" max="2100" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">NILAI PEROLEHAN <span className="text-gray-400 lowercase font-normal">(Rp)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                  <input type="text" name="originalValue" value={formData.originalValue} onChange={handleChange} placeholder="0" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all" />
                </div>
              </div>

            </div>
          </div>

          {/* Banner Bawah (Menghemat ruang vertikal) */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-[#0556B3] shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#0A356A]">Proses Verifikasi Aset</h4>
              <p className="text-xs text-gray-600 mt-0.5">Pastikan plat nama peralatan terlihat jelas di foto. Data akan diverifikasi selambatnya 24 jam kerja.</p>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: Kondisi, File, & Submit (Lebar 5 Kolom) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">

            {/* Judul Panel */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50 rounded-t-xl">
              <AlertCircle className="w-5 h-5 text-[#0A356A]" strokeWidth={2.5} />
              <h2 className="text-lg font-bold text-gray-900">Kondisi & Berkas</h2>
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">

              {/* Alasan Idle (Radio Grid 2x2 yang sangat hemat tempat) */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">ALASAN IDLE <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2.5" onBlur={handleBlur}>
                  {["1", "2", "3", "4"].map((id) => (
                    <label key={id} className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer transition-all ${formData.conditionId === id ? 'border-[#0556B3] bg-blue-50/40 ring-1 ring-[#0556B3]' : (showValidationErrors || touched.conditionId) && !formData.conditionId ? 'border-red-400 bg-red-50/30 hover:border-red-500' : 'border-gray-300 hover:border-gray-400'}`}>
                      <input type="radio" name="conditionId" value={id} checked={formData.conditionId === id} onChange={handleChange} onBlur={handleBlur} className="mt-0.5 w-3.5 h-3.5 text-[#0556B3] focus:ring-[#0556B3] cursor-pointer shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 leading-tight">{conditionLabels[id]}</span>
                    </label>
                  ))}
                </div>
                {(showValidationErrors || touched.conditionId) && !formData.conditionId && <p className="text-[10px] text-red-500 mt-1.5 font-medium">* Alasan idle wajib dipilih.</p>}
              </div>

              {/* Catatan Tambahan (Pendek) */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">CATATAN TAMBAHAN</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Keterangan kondisi, kontak penanggung jawab..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] outline-none transition-all resize-none"></textarea>
              </div>

              {/* Upload Dropzone (Lebih proporsional) */}
              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">FOTO PERALATAN</label>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[110px] ${
                    isDragging ? "border-[#0556B3] bg-blue-50/80" : "border-gray-300 hover:bg-blue-50/40 hover:border-[#0556B3]"
                  }`}
                >
                  <UploadCloud className={`w-7 h-7 mb-2 ${isDragging ? "text-[#0556B3] animate-bounce" : "text-gray-400"}`} />
                  <span className="text-xs font-bold text-gray-900">Klik atau tarik & lepas foto di sini</span>
                  <span className="text-[10px] text-gray-500 mt-1">Maksimal 5MB per file</span>
                  
                  {/* Preview Selected Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 w-full flex flex-wrap justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                      {uploadedFiles.map((file, i) => {
                        const isImage = file.type.startsWith('image/');
                        const previewUrl = isImage ? URL.createObjectURL(file) : null;
                        return (
                          <div key={i} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white w-[100px] shadow-sm hover:shadow-md transition-all hover:border-[#0A356A]">
                            {isImage ? (
                              <div className="h-16 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img src={previewUrl!} alt={file.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                            ) : (
                              <div className="h-16 w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                                <Paperclip className="w-5 h-5 mb-1" />
                                <span className="text-[9px] font-bold">PDF</span>
                              </div>
                            )}
                            <div className="px-1.5 py-1 border-t border-gray-100 bg-white">
                              <span className="block text-[9px] font-medium text-gray-700 truncate text-center" title={file.name}>{file.name}</span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(i);
                              }} 
                              className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 shadow-md transition-colors opacity-0 group-hover:opacity-100"
                              title="Hapus"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons (Ditempelkan di bawah Panel Kanan) */}
          <div className="flex items-center justify-end gap-3 mt-1">
            <Link href="/rendal/idle" className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-5 py-2.5 rounded-lg bg-[#0A356A] hover:bg-[#0556B3] text-white text-sm font-bold transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? "Menyimpan Data..." : "Simpan Data Peralatan"}
            </button>
          </div>

        </div>

      </form>

      {/* MODAL IMPORT DATA MASSAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-in-center">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0556B3]" />
                Import Data Massal
              </h3>
              <button onClick={() => {setShowImportModal(false); setImportFile(null);}} className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Gunakan fitur ini untuk meregistrasikan banyak peralatan sekaligus. Silakan pilih format file dan unggah dokumen Anda.
              </p>

              {/* Pilihan Format */}
              <div className="mb-5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">TIPE FORMAT DATA <span className="text-red-500">*</span></label>
                <select className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0556B3] focus:border-[#0556B3] outline-none transition-all bg-white font-medium text-gray-800">
                  <option value="excel">Microsoft Excel (.xlsx, .xls)</option>
                  <option value="csv">Comma Separated Values (.csv)</option>
                </select>
              </div>

              {/* Drag & Drop Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-blue-50/40 hover:border-[#0556B3] cursor-pointer transition-all bg-gray-50/30">
                <UploadCloud className="w-12 h-12 text-[#0556B3] mb-3" />
                <span className="text-base font-bold text-gray-900">Tarik & lepas file Anda di sini</span>
                <span className="text-xs text-gray-500 mt-1 mb-5">Atau klik tombol di bawah untuk mencari file dari komputer</span>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  id="import-file-upload"
                  onChange={(e) => {
                    if(e.target.files && e.target.files.length > 0) {
                      setImportFile(e.target.files[0]);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => document.getElementById('import-file-upload')?.click()}
                  className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Pilih File Dokumen
                </button>
              </div>

              {/* Preview File yang dipilih */}
              {importFile && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileSpreadsheet className="w-5 h-5 text-blue-700 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-800 truncate">{importFile.name}</p>
                      <p className="text-[10px] text-blue-600 font-medium">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setImportFile(null)} className="text-blue-700 hover:text-blue-900 p-1.5 hover:bg-blue-100 rounded-md transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {setShowImportModal(false); setImportFile(null);}}
                className="px-5 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
              >
                Batal
              </button>
              <button
                disabled={isImporting}
                onClick={() => {
                  if(!importFile) {
                    alert("Harap pilih file terlebih dahulu sebelum memproses import!");
                    return;
                  }

                  // Simulasi Loading Import
                  setIsImporting(true);
                  setTimeout(() => {
                    setIsImporting(false);
                    alert(`File ${importFile.name} berhasil disiapkan untuk di-import!`);
                    setShowImportModal(false);
                    setImportFile(null);
                  }, 2000);

                }}
                className="px-5 py-2 text-sm font-bold text-white bg-[#0A356A] hover:bg-[#0556B3] rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isImporting ? "Memproses..." : "Proses Import Data"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULLSCREEN SPINNER OVERLAY (MUTAR-MUTAR) */}
      {(isSubmitting || isImporting) && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100">
            <Loader2 className="w-12 h-12 text-[#0556B3] animate-spin mb-4" />
            <h2 className="text-lg font-bold text-gray-900">
              {isSubmitting ? "Menyimpan Data..." : "Memproses Dokumen..."}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

    </div>
  );
}
