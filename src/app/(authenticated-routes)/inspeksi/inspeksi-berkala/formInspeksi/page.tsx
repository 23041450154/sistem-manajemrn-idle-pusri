"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { getEquipments, submitInspectionData } from "@/action/api";

export default function FormInspeksiPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const equipmentId = searchParams.get("equipmentId");

  const [equipment, setEquipment] = useState<any>(null);
  
  // Form State
  const [hasilInspeksi, setHasilInspeksi] = useState<string>(""); // "READY", "REPAIR", "DISPOSAL"
  const [jenisPerbaikan, setJenisPerbaikan] = useState<string>(""); // "RINGAN", "OVERHAUL"
  const [mechanicalCondition, setMechanicalCondition] = useState<string>("");
  const [electricalCondition, setElectricalCondition] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>("");
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{show: boolean, type: 'success'|'error', message: string}>({ show: false, type: 'success', message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (equipmentId) {
      getEquipments().then((res) => {
        const eq = res.find((e: any) => String(e.id) === String(equipmentId));
        if (eq) setEquipment(eq);
      });
    }
  }, [equipmentId]);

  const showToast = (type: 'success'|'error', message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    setFileError("");
    const selectedFiles = Array.from(e.target.files);
    let validFiles: File[] = [];
    let hasError = false;

    for (const file of selectedFiles) {
      // Validasi Ekstensi
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setFileError("Format file tidak didukung. Harap gunakan JPG, JPEG, atau PNG.");
        hasError = true;
        break;
      }

      // Validasi Ukuran (Maks 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`File ${file.name} melebihi batas 5MB.`);
        hasError = true;
        break;
      }
      
      validFiles.push(file);
    }

    if (!hasError) {
      setFiles(prev => [...prev, ...validFiles]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileError) setFileError(""); // Reset error if they remove file
  };

  // Validasi Form untuk men-disable tombol submit
  const isNotesEmpty = !notes || notes.trim() === "";
  const isKelayakanNotSelected = hasilInspeksi === "";
  const isPerbaikanKhususNotSelected = hasilInspeksi === "REPAIR" && jenisPerbaikan === "";
  const isKondisiEmpty = !mechanicalCondition.trim() || !electricalCondition.trim();
  const isFilesNotEnough = files.length < 2;

  const isSubmitDisabled = isKelayakanNotSelected || isPerbaikanKhususNotSelected || isKondisiEmpty || isNotesEmpty || isFilesNotEnough || loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("equipment_id", equipmentId || "");
      
      // Mapping ke Payload Swagger
      let requireActionId = 1;
      let isUtilizableStr = "true";
      let needsRefurbishmentStr = "false";

      if (hasilInspeksi === "READY") {
        requireActionId = 1;
        isUtilizableStr = "true";
        needsRefurbishmentStr = "false";
      } else if (hasilInspeksi === "REPAIR") {
        requireActionId = jenisPerbaikan === "RINGAN" ? 2 : 3;
        isUtilizableStr = "true";
        needsRefurbishmentStr = "true";
      } else if (hasilInspeksi === "DISPOSAL") {
        requireActionId = 4;
        isUtilizableStr = "false";
        needsRefurbishmentStr = "false";
      }

      formData.append("is_utilizable", isUtilizableStr);
      if (isUtilizableStr === "true") {
        formData.append("needs_refurbishment", needsRefurbishmentStr);
      }
      formData.append("require_action_id", requireActionId.toString());
      
      formData.append("mechanical_condition", mechanicalCondition.trim());
      formData.append("electrical_condition", electricalCondition.trim());
      formData.append("notes", notes.trim());
      
      files.forEach((file) => {
        formData.append("photo", file); 
      });

      const response = await submitInspectionData(formData);
      
      if (response.success) {
        showToast("success", `Hasil inspeksi berhasil disimpan dengan status ${response.new_status || 'BERHASIL'}`);
        setTimeout(() => {
          router.push("/inspeksi/inspeksi-berkala");
        }, 2000);
      } else {
        showToast("error", response.message || "Gagal menyimpan hasil inspeksi.");
        setLoading(false);
      }
    } catch (error: any) {
      showToast("error", error?.message || "Terjadi kesalahan sistem.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-2 pb-8 relative">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 transform transition-all animate-in slide-in-from-top-2 fade-in ${toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-800' : 'bg-red-50 border-l-4 border-red-500 text-red-800'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <p className="text-sm font-semibold">{toast.message}</p>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-4 text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0A356A] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Antrean
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Formulir Inspeksi Fisik Lapangan</h1>
        <p className="text-sm text-gray-500 mt-1">Lengkapi data hasil pengecekan untuk menentukan kelayakan peralatan.</p>
      </div>

      <div className="bg-[#F4F9FD] border border-[#BBE1FA] rounded-lg p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
          <div>
            <p className="text-xs text-[#0284c7] font-medium mb-1">Kode Aset:</p>
            <p className="text-sm font-bold text-[#0A356A]">{equipment?.equipment_code || "Memuat..."}</p>
          </div>
          <div>
            <p className="text-xs text-[#0284c7] font-medium mb-1">Nama Aset:</p>
            <p className="text-sm font-bold text-[#0A356A]">{equipment?.name || "Memuat..."}</p>
          </div>
          <div>
            <p className="text-xs text-[#0284c7] font-medium mb-1">Plant Asal & Lokasi Penyimpanan:</p>
            <p className="text-sm font-medium text-gray-900">
              <span className="font-semibold">{(typeof equipment?.plant === 'string' ? equipment.plant : equipment?.plant?.name) || equipment?.area?.name || "-"}</span> - {(typeof equipment?.location === 'string' ? equipment.location : equipment?.location?.name) || equipment?.storage_location?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#0284c7] font-medium mb-1">Tanggal Deklarasi Idle:</p>
            <p className="text-sm font-medium text-gray-900">
              {equipment?.updated_at ? new Date(equipment.updated_at).toISOString().split('T')[0] : "2026-03-31"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#0284c7] font-medium mb-1">Status Saat Ini:</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E0E7FF] text-[#4F46E5] mt-0.5">
              {typeof equipment?.status === 'string' ? equipment.status : equipment?.status?.name || "IDLE"}
            </span>
          </div>
          <div>
            <p className="text-xs text-[#0284c7] font-medium mb-1">Petugas Pemeriksa (Inspector):</p>
            <p className="text-sm font-bold text-gray-900">
              Siti Rahayu (100003)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-5">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Kiri: Pertanyaan & Catatan */}
          <div className="flex flex-col gap-6">
            {/* Komponen 1: Hasil Inspeksi Aset */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Hasil Inspeksi Aset? <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="hasil_inspeksi" 
                    value="READY" 
                    checked={hasilInspeksi === "READY"} 
                    onChange={(e) => {
                      setHasilInspeksi(e.target.value);
                      setJenisPerbaikan("");
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-800">Layak (Tidak Perlu Perbaikan)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="hasil_inspeksi" 
                    value="REPAIR" 
                    checked={hasilInspeksi === "REPAIR"} 
                    onChange={(e) => setHasilInspeksi(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-800">Memerlukan Perbaikan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="hasil_inspeksi" 
                    value="DISPOSAL" 
                    checked={hasilInspeksi === "DISPOSAL"} 
                    onChange={(e) => {
                      setHasilInspeksi(e.target.value);
                      setJenisPerbaikan("");
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-800">Tidak Layak (Rusak Berat)</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">Catatan: Sesuai alur, keputusan disposal akan dikirim ke Rendal untuk verifikasi.</p>
            </div>

            {/* Komponen 2: Jenis Perbaikan (Kondisional) */}
            {hasilInspeksi === "REPAIR" && (
              <div className="animate-in fade-in slide-in-from-top-2 bg-[#F8FAFC] border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Jenis Perbaikan? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="jenis_perbaikan" 
                      value="RINGAN" 
                      checked={jenisPerbaikan === "RINGAN"} 
                      onChange={(e) => setJenisPerbaikan(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">Perbaikan Ringan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="jenis_perbaikan" 
                      value="OVERHAUL" 
                      checked={jenisPerbaikan === "OVERHAUL"} 
                      onChange={(e) => setJenisPerbaikan(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">Overhaul / Perbaikan Besar</span>
                  </label>
                </div>
              </div>
            )}

            {/* Komponen 2.5: Kondisi Mekanik & Elektrik */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Kondisi Mekanik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={mechanicalCondition}
                  onChange={(e) => setMechanicalCondition(e.target.value)}
                  placeholder="Contoh: Seal bocor, bearing aus..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Kondisi Elektrik <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={electricalCondition}
                  onChange={(e) => setElectricalCondition(e.target.value)}
                  placeholder="Contoh: Kabel terkelupas, motor baik..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Komponen 3: Catatan */}
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Temuan Fisik / Catatan Inspeksi <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan detail pemeriksaan fisik (misal: kebocoran seal, tingkat korosi, kelistrikan)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all text-sm resize-none flex-1 min-h-[100px]"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1.5">Wajib diisi dan tidak boleh hanya berupa spasi kosong.</p>
            </div>
          </div>

          {/* Kanan: Upload Foto */}
          <div className="flex flex-col h-full">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Foto Bukti Lapangan (Nameplate & Kondisi Fisik) <span className="text-red-500">*</span>
            </label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0A356A] transition-all min-h-[180px]"
            >
              {files.length === 0 ? (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-sm font-semibold text-[#0A356A] text-center">Klik atau Seret Berkas ke Sini</p>
                  <p className="text-xs text-gray-500 mt-1.5 text-center">Format JPG/PNG, maks. 5MB</p>
                </>
              ) : (
                <div className="w-full h-full flex flex-col justify-start">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-4">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${idx}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transform scale-90 group-hover:scale-100 transition-all shadow-lg"
                            title="Hapus foto"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-center gap-2 text-sm font-semibold text-[#0A356A] bg-blue-50 py-2 rounded-lg border border-blue-100 transition-colors w-full">
                    <UploadCloud className="w-4 h-4" /> Tambah Foto Lainnya
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-2.5 text-xs font-medium text-red-500">
              * Wajib unggah min. 2 berkas foto bukti. (Terunggah: {files.length})
            </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept="image/jpeg, image/png, image/jpg" 
            className="hidden" 
          />
          
          {fileError && (
            <div className="mt-2 text-sm font-medium text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {fileError}
            </div>
          )}
        </div>
      </div>

        <div className="pt-5 mt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-gray-300 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmitDisabled}
            className={`w-full sm:w-auto flex items-center justify-center px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${
              isSubmitDisabled 
                ? 'bg-[#E2E8F0] text-gray-400 cursor-not-allowed border border-transparent' 
                : 'bg-[#E2E8F0] text-[#0A356A] hover:bg-[#CBD5E1] border border-transparent'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              'Kirim Hasil Inspeksi'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
