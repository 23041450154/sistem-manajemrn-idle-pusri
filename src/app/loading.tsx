import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100">
        <Loader2 className="w-12 h-12 text-[#0556B3] animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Memuat Halaman...</h2>
        <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}
