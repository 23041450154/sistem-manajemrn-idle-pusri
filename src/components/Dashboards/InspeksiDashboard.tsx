"use client";

import React from 'react';
import { 
  Activity, 
  ClipboardCheck, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  AlertTriangle, 
  Search,
  Filter,
  CalendarDays,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// --- MOCK DATA ---
const chartData = [
  { name: 'Pabrik 1A', selesai: 120, minor: 15, kritis: 2 },
  { name: 'Pabrik 1B', selesai: 90, minor: 25, kritis: 8 },
  { name: 'Pabrik 2B', selesai: 110, minor: 10, kritis: 0 },
  { name: 'Utilitas', selesai: 80, minor: 20, kritis: 4 },
  { name: 'Gudang', selesai: 40, minor: 5, kritis: 0 },
];

const logInspeksi = [
  { id: 'PSR-CMP-088', unit: 'Pabrik 1B', alat: 'Ammonia Compressor 2', temuan: 'Overheating pada bearing utama', status: 'KRITIS' },
  { id: 'PSR-HTR-042', unit: 'Pabrik 1A', alat: 'Primary Reformer Heater', temuan: 'Indikasi retak mikro pada tube 4', status: 'PERHATIAN' },
  { id: 'PSR-PMP-102', unit: 'Utilitas', alat: 'Boiler Feed Water Pump', temuan: 'Vibrasi tinggi terdeteksi (8.5 mm/s)', status: 'KRITIS' },
];

const jadwalMendatang = [
  { date: '14 Okt', time: '08:00 WIB', title: 'Preventive Maintenance: Pabrik 1B', team: 'Tim Inspeksi Mekanikal', day: '14' },
  { date: '16 Okt', time: '09:30 WIB', title: 'Inspeksi Rutin: Area Utilitas', team: 'Siti Aminah, Dwi Cahyo', day: '16' },
  { date: '18 Okt', time: '13:00 WIB', title: 'NDT Testing: Tangki Ammonia', team: 'Tim Eksternal (Kontraktor)', day: '18' },
];

const kesehatanUnit = [
  { name: 'Pabrik 1A', score: 92 },
  { name: 'Utilitas', score: 85 },
  { name: 'Pabrik 1B', score: 78, warning: true },
  { name: 'Pabrik 2B', score: 90 },
];

export default function InspeksiDashboardPremium() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-[#F8F9FB] min-h-screen relative pb-24">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Inspeksi</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Pemantauan kesehatan aset dan log inspeksi terkini.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari aset atau inspeksi..." 
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm shrink-0">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Unit</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm shrink-0">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">30 Hari Terakhir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0A356A] flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20 text-white">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Asset Health Index</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">87%</span>
              </div>
              <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                <span className="text-lg leading-none">&uarr;</span> +2.4% vs Bulan Lalu
              </p>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-600">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Inspeksi (Bulan Ini)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">342</span>
              </div>
              <p className="text-xs font-medium mt-1">
                <span className="text-emerald-600">310 Tpt Jdwal</span> <span className="text-gray-300 mx-1">|</span> <span className="text-orange-500">32 Tdk Jdwal</span>
              </p>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-100 text-sky-600">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Compliance Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">94%</span>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-1">
                Target: 95%
              </p>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 text-amber-600">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Avg. Resolution Time</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">18<span className="text-lg text-gray-500 ml-0.5">h</span></span>
              </div>
              <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                <span className="text-lg leading-none">&darr;</span> 2h dari rata-rata
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Wider) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Chart Section */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-gray-900">Status Inspeksi Berdasarkan Unit Pabrik</h2>
              <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>Bulan Ini</option>
                <option>Bulan Lalu</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar dataKey="selesai" name="Selesai (Aman)" stackId="a" fill="#0A356A" radius={[0, 0, 4, 4]} barSize={40} />
                  <Bar dataKey="minor" name="Temuan Minor" stackId="a" fill="#93C5FD" />
                  <Bar dataKey="kritis" name="Temuan Kritis" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Log Table Section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Log Inspeksi Prioritas Tinggi (Terbaru)</h2>
              <button className="text-sm font-semibold text-[#0A356A] hover:text-blue-800 flex items-center gap-1 transition-colors">
                Lihat Semua <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Asset ID</th>
                    <th className="px-6 py-4 whitespace-nowrap">Peralatan</th>
                    <th className="px-6 py-4 whitespace-nowrap">Unit</th>
                    <th className="px-6 py-4">Temuan</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logInspeksi.map((log, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#0A356A] whitespace-nowrap">{log.id}</td>
                      <td className="px-6 py-5 font-medium text-gray-800">{log.alat}</td>
                      <td className="px-6 py-5 text-gray-600 whitespace-nowrap">{log.unit}</td>
                      <td className={`px-6 py-5 font-medium ${log.status === 'KRITIS' ? 'text-red-600' : 'text-gray-700'}`}>
                        {log.temuan}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${
                          log.status === 'KRITIS' 
                            ? 'bg-red-50 text-red-600 border-red-200/60' 
                            : 'bg-amber-50 text-amber-600 border-amber-200/60'
                        }`}>
                          {log.status === 'KRITIS' ? '● KRITIS' : '● PERHATIAN'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-gray-400 group-hover:text-[#0A356A] group-hover:bg-blue-50 transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (Narrower) */}
        <div className="space-y-8">
          
          {/* Jadwal Mendatang */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Jadwal Mendatang</h2>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                </div>
              </button>
            </div>
            
            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
              {jadwalMendatang.map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-blue-50 border-[3px] border-white flex items-center justify-center shadow-sm">
                    <span className="text-[10px] font-bold text-[#0A356A]">{item.day}</span>
                  </div>
                  
                  <div className="mb-1">
                    <span className="text-xs font-bold text-[#0A356A] bg-blue-50/50 px-2 py-0.5 rounded-md">{item.date}, {item.time}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mt-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.team}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Temuan Kritikal Aktif */}
          <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-red-900">Temuan Kritikal Aktif</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-red-600">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 text-sm">PSR-CMP-088</span>
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase tracking-wider">Prioritas 1</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  Overheating pada thrust bearing. Indikasi keausan abnormal atau masalah pelumasan.
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Dilaporkan: 2j lalu</span>
                  <a href="#" className="font-semibold text-[#0A356A] hover:underline">Detail Teknis</a>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 text-sm">PSR-PMP-102</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase tracking-wider">Prioritas 2</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  Vibrasi motor pompa melebihi ambang batas toleransi (ISO 10816).
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Dilaporkan: 5j lalu</span>
                  <a href="#" className="font-semibold text-[#0A356A] hover:underline">Detail Teknis</a>
                </div>
              </div>
            </div>
          </div>

          {/* Kesehatan per Unit */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Kesehatan per Unit</h2>
            <div className="space-y-5">
              {kesehatanUnit.map((unit, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-gray-700">{unit.name}</span>
                    <span className={unit.warning ? 'text-amber-600' : 'text-[#0A356A]'}>{unit.score}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${unit.warning ? 'bg-amber-500' : 'bg-[#0A356A]'}`}
                      style={{ width: `${unit.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0A356A] hover:bg-blue-800 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-900/30 transition-transform hover:scale-105 z-50">
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
}
