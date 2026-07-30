"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Database } from "lucide-react";
import Link from "next/link";
import { getEquipments } from "@/action/api";

interface Equipment {
  id: string | number;
  equipment_code: string;
  name: string;
  status: string;
  location?: string;
  plant?: string;
  storage_location?: { name: string };
  area?: { name: string };
  updated_at?: string; 
  created_at?: string;
}

export default function InspeksiAntreanPage() {
  const [data, setData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getEquipments();
        if (result && result.length > 0) {
          let idleEqs = result.filter((eq: any) => {
            const statusStr = typeof eq.status === 'string' ? eq.status : eq.status?.name;
            return statusStr === "IDLE";
          });
          setData(idleEqs);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Gagal mengambil data peralatan:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto p-4 flex flex-col h-[calc(100vh-72px)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 shrink-0 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daftar Inspeksi Aset Idle</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar aset berstatus IDLE yang tersedia untuk dilakukan inspeksi kondisi fisik oleh Inspektur Teknik.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 shrink-0">
        <label className="block text-sm font-bold text-gray-700 mb-3">Cari Kode / Nama Alat Idle</label>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Cari kode atau nama..." 
            className="flex-1 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-[#0A356A] focus:ring-1 focus:ring-[#0A356A] outline-none transition-all placeholder:text-gray-400" 
          />
          <button className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 bg-white">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10">
              <tr className="border-b-2 border-gray-300">
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">KODE ALAT</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">NAMA ALAT</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">PLANT & LOKASI PENYIMPANAN</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">TANGGAL IDLE</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">LAMA IDLE</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">STATUS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-[13px]">Memuat data aset...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="text-[13px] font-medium text-gray-900 mb-1">Data Tidak Ditemukan</p>
                      <p className="text-[12px] text-gray-500">Tidak ada aset IDLE untuk diinspeksi.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, i) => {
                  const idleDateStr = row.updated_at || row.created_at || new Date().toISOString();
                  const idleDate = new Date(idleDateStr);
                  const now = new Date();
                  const diffTime = Math.abs(now.getTime() - idleDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={i} className="border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] font-bold text-[#0A356A]">
                        {row.equipment_code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] text-gray-900 font-semibold line-clamp-2" title={row.name}>
                          {row.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[12px] text-gray-900 font-medium">{(typeof row.plant === 'string' ? row.plant : row.plant?.name) || row.area?.name || "-"}</div>
                        <div className="text-gray-500 text-[11px]">{(typeof row.location === 'string' ? row.location : row.location?.name) || row.storage_location?.name || "-"}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-600">
                        {idleDate.toISOString().split('T')[0]}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-gray-700 font-medium">
                        {diffDays} Hari
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0E7FF] text-[#4F46E5]">
                          IDLE
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/inspeksi/inspeksi-berkala/formInspeksi?equipmentId=${row.id}`} 
                            className="inline-flex items-center justify-center bg-[#0A356A] text-white hover:bg-[#062854] px-4 py-1.5 rounded-md text-[11px] font-medium transition-all shadow-sm whitespace-nowrap"
                          >
                            Mulai Inspeksi
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
