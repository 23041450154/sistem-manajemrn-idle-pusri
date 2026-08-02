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
        className="flex items-center gap-2.5 text-base font-bold text-gray-650 hover:text-[#0A356A] mb-5 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
        Kembali ke Antrean
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Formulir Inspeksi Fisik Lapangan</h1>
        <p className="text-base text-gray-600 mt-1">Lengkapi data hasil pengecekan untuk menentukan kelayakan peralatan.</p>
      </div>

      <div className="bg-[#F4F9FD] border border-[#BBE1FA] rounded-xl p-8 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Kode Aset</p>
            <p className="text-lg font-extrabold text-[#0A356A]">{equipment?.equipment_code || "Memuat..."}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Nama Aset</p>
            <p className="text-lg font-extrabold text-[#0A356A]">{equipment?.name || "Memuat..."}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Plant Asal & Lokasi Penyimpanan</p>
            <p className="text-lg font-semibold text-gray-900">
              <span className="font-bold">{(typeof equipment?.plant === 'string' ? equipment.plant : equipment?.plant?.name) || equipment?.area?.name || "-"}</span> - {(typeof equipment?.location === 'string' ? equipment.location : equipment?.location?.name) || equipment?.storage_location?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Tanggal Deklarasi Idle</p>
            <p className="text-lg font-semibold text-gray-900">
              {equipment?.updated_at ? new Date(equipment.updated_at).toISOString().split('T')[0] : "2026-03-31"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Status Saat Ini</p>
            <div>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E0E7FF] text-[#4F46E5] mt-0.5 border border-[#C7D2FE]">
                {typeof equipment?.status === 'string' ? equipment.status : equipment?.status?.name || "IDLE"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-semibold mb-1">Petugas Pemeriksa (Inspector)</p>
            <p className="text-lg font-extrabold text-gray-900">
              Siti Rahayu (100003)
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-250 rounded-2xl shadow-md p-8 flex flex-col gap-6">
        
        {/* Info Wajib Diisi di atas */}
        <div className="flex justify-end shrink-0">
          <span className="text-sm font-bold text-red-500">* Wajib diisi</span>
        </div>

        {/* Grid Pembagian Ruang: Kiri 60% (col-span-3), Kanan 40% (col-span-2) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Kiri: Pertanyaan & Catatan (col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Komponen 1: Hasil Inspeksi Aset */}
            <div className="flex-1">
              <label className="block text-base font-bold text-gray-900 mb-4">
                Hasil Inspeksi Aset? <span className="text-red-500">*</span>
              </label>
              
              <div className="flex flex-col gap-5">
                {/* Layak */}
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="hasil_inspeksi" 
                    value="READY" 
                    checked={hasilInspeksi === "READY"} 
                    onChange={(e) => {
                      setHasilInspeksi(e.target.value);
                      setJenisPerbaikan("");
                    }}
                    className="w-6 h-6 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-base font-extrabold text-gray-800 group-hover:text-[#0A356A] transition-colors">Layak</span>
                    <p className="text-sm text-gray-500 font-semibold mt-0.5">Tidak perlu perbaikan</p>
                  </div>
                </label>

                {/* Memerlukan Perbaikan */}
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="hasil_inspeksi" 
                    value="REPAIR" 
                    checked={hasilInspeksi === "REPAIR"} 
                    onChange={(e) => setHasilInspeksi(e.target.value)}
                    className="w-6 h-6 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-base font-extrabold text-gray-800 group-hover:text-[#0A356A] transition-colors">Perlu Perbaikan</span>
                    <p className="text-sm text-gray-500 font-semibold mt-0.5">Membutuhkan perbaikan ringan atau overhaul</p>
                  </div>
                </label>

                {/* Tidak Layak */}
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="hasil_inspeksi" 
                    value="DISPOSAL" 
                    checked={hasilInspeksi === "DISPOSAL"} 
                    onChange={(e) => {
                      setHasilInspeksi(e.target.value);
                      setJenisPerbaikan("");
                    }}
                    className="w-6 h-6 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="text-base font-extrabold text-gray-800 group-hover:text-[#0A356A] transition-colors">Tidak Layak</span>
                    <p className="text-sm text-gray-500 font-semibold mt-0.5">(Rekomendasi Disposal)</p>
                  </div>
                </label>
              </div>

              {/* Warning/Catatan untuk Disposal */}
              {hasilInspeksi === "DISPOSAL" && (
                <p className="text-sm text-amber-800 mt-4 font-bold bg-amber-50 p-4 rounded-xl border border-amber-200 animate-in fade-in duration-200">
                  * Aset akan diajukan sebagai rekomendasi disposal dan memerlukan persetujuan Rendal.
                </p>
              )}
            </div>

            {/* Komponen 2: Jenis Perbaikan (Kondisional) */}
            {hasilInspeksi === "REPAIR" && (
              <div className="animate-in fade-in slide-in-from-top-2 bg-[#F8FAFC] border border-gray-200 rounded-xl p-5">
                <label className="block text-base font-bold text-gray-900 mb-4">
                  Jenis Perbaikan? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="jenis_perbaikan" 
                      value="RINGAN" 
                      checked={jenisPerbaikan === "RINGAN"} 
                      onChange={(e) => setJenisPerbaikan(e.target.value)}
                      className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-base font-bold text-gray-800 cursor-pointer">Perbaikan Ringan</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="jenis_perbaikan" 
                      value="OVERHAUL" 
                      checked={jenisPerbaikan === "OVERHAUL"} 
                      onChange={(e) => setJenisPerbaikan(e.target.value)}
                      className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-base font-bold text-gray-800 cursor-pointer">Overhaul / Perbaikan Besar</span>
                  </label>
                </div>
              </div>
            )}

            {/* Komponen 2.5: Kondisi Mekanik & Elektrik */}
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1">
                <label className="block text-base font-bold text-gray-900 mb-2.5">
                  Kondisi Mekanik <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={mechanicalCondition}
                  onChange={(e) => setMechanicalCondition(e.target.value)}
                  placeholder={"Misal:\n- Seal bocor\n- Bearing aus\n- Mur hilang"}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all text-base font-medium resize-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-base font-bold text-gray-900 mb-2.5">
                  Kondisi Elektrik <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={electricalCondition}
                  onChange={(e) => setElectricalCondition(e.target.value)}
                  placeholder={"Misal:\n- Kabel terkelupas\n- Motor baik\n- Indikator mati"}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all text-base font-medium resize-none"
                />
              </div>
            </div>

            {/* Komponen 3: Catatan */}
            <div className="flex-1 flex flex-col">
              <label className="block text-base font-bold text-gray-900 mb-2.5">
                Temuan Fisik / Catatan Inspeksi <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan temuan lapangan secara rinci di sini..."
                rows={6}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A356A] focus:border-[#0A356A] outline-none transition-all text-base resize-none flex-1 min-h-[180px] font-medium"
              ></textarea>
              <p className="text-sm text-gray-600 mt-2 font-medium">Wajib diisi dan tidak boleh hanya berupa spasi kosong.</p>
            </div>
          </div>

          {/* Kanan: Upload Foto (col-span-2) - Diperkecil 20% */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="mb-2">
              <label className="block text-base font-bold text-gray-900">
                Foto Bukti Lapangan <span className="text-red-500">*</span>
              </label>
              <p className="text-sm font-bold text-red-600">
                (minimal 2 foto)
              </p>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#0A356A] transition-all min-h-[150px]"
            >
              {files.length === 0 ? (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-base font-bold text-[#0A356A] text-center">Klik atau Seret Berkas</p>
                  <p className="text-sm text-gray-500 mt-1 text-center font-medium">JPG, PNG maks 5 MB</p>
                </>
              ) : (
                <div className="w-full h-full flex flex-col justify-start">
                  <div className="grid grid-cols-2 gap-2.5 w-full mb-3">
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
                  <div className="mt-auto flex items-center justify-center gap-2 text-sm font-bold text-[#0A356A] bg-blue-50 py-2.5 rounded-lg border border-blue-100 transition-colors w-full h-11">
                    <UploadCloud className="w-4 h-4" /> Tambah Foto
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3 text-sm font-bold text-gray-800">
              Terunggah: <span className={files.length >= 2 ? "text-green-600" : "text-red-500"}>{files.length} berkas</span>
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
            className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border border-gray-300 rounded-lg font-bold text-base text-gray-700 hover:bg-gray-50 transition-all shadow-sm h-12"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmitDisabled}
            className={`w-full sm:w-auto flex items-center justify-center px-8 py-3.5 rounded-lg font-bold text-base transition-all shadow-sm h-12 ${
              isSubmitDisabled 
                ? 'bg-[#E2E8F0] text-gray-400 cursor-not-allowed border border-transparent' 
                : 'bg-[#0A356A] text-white hover:bg-[#062854] border border-transparent'
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
