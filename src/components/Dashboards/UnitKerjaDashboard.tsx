"use client";

import React from 'react';
import { 
  LayoutGrid, 
  Settings, 
  Package, 
  Bell, 
  Download, 
  MoreHorizontal,
  Wrench,
  ShieldAlert,
  Cog
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// --- MOCK DATA ---
const barData = [
  { name: 'Pabrik 1A', value: 420 },
  { name: 'Pabrik 1B', value: 280 },
  { name: 'Pabrik 2A', value: 350 },
  { name: 'Pabrik 2B', value: 198 },
];

const pieData = [
  { name: 'Aktif', value: 79, color: '#10B981' },
  { name: 'Idle', value: 17, color: '#F59E0B' },
  { name: 'Rusak', value: 4, color: '#EF4444' },
];

const permintaanTerbaru = [
  { id: 'REQ-2023-1042', name: 'Heat Exchanger E-101', type: 'Peminjaman', date: '24 Okt 2023', status: 'Pending' },
  { id: 'REQ-2023-1045', name: 'Genset Cummins 500kVA', type: 'Pengembalian', date: '25 Okt 2023', status: 'Approved' },
  { id: 'REQ-2023-1048', name: 'Scaffolding Set (50 pcs)', type: 'Peminjaman', date: '26 Okt 2023', status: 'Pending' },
  { id: 'REQ-2023-1051', name: 'Welding Machine Miller', type: 'Peminjaman', date: '26 Okt 2023', status: 'Approved' },
];

const maintenanceJadwal = [
  { title: 'Inspeksi Rutin Pompa P-201', time: 'Besok, 09:00 WIB', icon: ShieldAlert, color: 'bg-blue-100 text-blue-600' },
  { title: 'Kalibrasi Sensor Suhu T-105', time: '28 Okt 2023', icon: Wrench, color: 'bg-orange-100 text-orange-500' },
  { title: 'Penggantian Pelumas Kompresor', time: '30 Okt 2023', icon: Cog, color: 'bg-gray-100 text-gray-500' },
];

export default function UnitKerjaDashboard() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-[#F8F9FB] min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Dashboard Unit Kerja</h1>
          <p className="text-sm text-gray-500 font-medium">Ikhtisar aset dan aktivitas operasional harian.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Aset Unit</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">1,248</div>
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              &uarr; +12 dari bulan lalu
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aset Aktif</span>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Settings className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">986</div>
            <p className="text-xs font-medium text-gray-500">
              79% dari total aset
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aset Idle (Ready)</span>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 mb-1">214</div>
            <p className="text-xs font-medium text-gray-500">
              Siap untuk digunakan/dimobilisasi
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Permintaan Menunggu</span>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-red-600 mb-1">48</div>
            <p className="text-xs font-medium text-red-600 flex items-center gap-1">
              <span className="font-bold">!</span> 12 Butuh persetujuan segera
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Status Pemanfaatan Aset</h2>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1F2937', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-gray-900">1,248</span>
              <span className="text-xs font-medium text-gray-500">Total Unit</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs font-medium text-gray-600">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Distribusi Aset per Lokasi</h2>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} ticks={[0, 250, 500]} domain={[0, 500]} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="#0284C7" radius={[4, 4, 0, 0]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Permintaan */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Permintaan Terbaru</h2>
            <button className="text-sm font-semibold text-[#0A356A] hover:text-blue-800 transition-colors">
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Asset ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Equipment Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Request Type</th>
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permintaanTerbaru.map((req, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0A356A] whitespace-nowrap">{req.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{req.name}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{req.type}</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{req.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${
                        req.status === 'Approved' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline Jadwal Maintenance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Jadwal Maintenance Unit</h2>
          <div className="relative border-l border-gray-100 ml-4 space-y-8 pb-4">
            {maintenanceJadwal.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <div className={`absolute -left-4 top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${item.color}`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm pt-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// Helper icon component
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
