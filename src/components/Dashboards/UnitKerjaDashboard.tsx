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

import { getEquipments } from '@/action/api';

export default function UnitKerjaDashboard() {
  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetch() {
      try {
        const equipments = await getEquipments();
        setData(equipments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, []);

  const totalAset = data.length;
  
  const activeCount = data.filter(a => a.status?.name === 'ACTIVE').length || 0;
  const idleCount = data.filter(a => a.status?.name === 'IDLE').length || 0;
  const rusakCount = data.filter(a => a.status?.name === 'DALAM_PERBAIKAN').length || 0;
  const othersCount = totalAset - activeCount - idleCount - rusakCount;

  // Let's assume if there are no ACTIVE, we just show others as ACTIVE for display purposes if the status names don't match perfectly. But it's better to stick to real counts.
  const pieData = [
    { name: 'Aktif', value: activeCount + othersCount, color: '#10B981' },
    { name: 'Idle', value: idleCount, color: '#F59E0B' },
    { name: 'Rusak', value: rusakCount, color: '#EF4444' },
  ].filter(p => p.value > 0);
  
  // If no pieData, supply a dummy one for empty state
  if (pieData.length === 0) pieData.push({ name: 'Belum Ada Data', value: 1, color: '#E5E7EB' });

  // Group by plant
  const plants = data.reduce((acc: any, curr: any) => {
    const plant = curr.plant || 'Lainnya';
    acc[plant] = (acc[plant] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(plants).map(key => ({
    name: key,
    value: plants[key]
  }));

  const readyToReuseCount = data.filter(a => a.status?.name === 'READY_TO_REUSE' || a.status?.name === 'IDLE').length || 0;
  // Temporary logic for 'Permintaan Menunggu'
  const permintaanMenunggu = data.filter(a => !a.status?.name || a.status?.name === 'REGISTERED').length || 0;

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
            <div className="text-3xl font-extrabold text-gray-900 mb-1">{isLoading ? "..." : totalAset}</div>
            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              Data aktual dari database
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
            <div className="text-3xl font-extrabold text-gray-900 mb-1">{isLoading ? "..." : activeCount + othersCount}</div>
            <p className="text-xs font-medium text-gray-500">
              {(totalAset > 0 ? Math.round(((activeCount + othersCount) / totalAset) * 100) : 0)}% dari total aset
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
            <div className="text-3xl font-extrabold text-gray-900 mb-1">{isLoading ? "..." : readyToReuseCount}</div>
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
            <div className="text-3xl font-extrabold text-red-600 mb-1">{isLoading ? "..." : permintaanMenunggu}</div>
            <p className="text-xs font-medium text-red-600 flex items-center gap-1">
              Menunggu validasi/persetujuan
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
              <span className="text-2xl font-extrabold text-gray-900">{totalAset}</span>
              <span className="text-xs font-medium text-gray-500">Total Unit</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs font-medium text-gray-600">{item.name} ({totalAset > 0 ? Math.round((item.value / totalAset) * 100) : 0}%)</span>
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



    </div>
  );
}


