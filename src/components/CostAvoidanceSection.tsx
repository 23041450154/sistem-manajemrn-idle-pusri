"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  TrendingDown,
  Recycle,
  ChevronDown,
  Clock,
  Wrench,
  CheckCircle,
  AlertCircle,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getEquipments, getDisposals } from "@/action/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Equipment = any;

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(2)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  }
  return `Rp ${value.toLocaleString("id-ID")}`;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function CostAvoidanceSection() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [disposals, setDisposals] = useState<Equipment[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eq, disp] = await Promise.all([getEquipments(), getDisposals()]);
        setEquipments(eq || []);
        setDisposals(disp || []);
      } catch (error) {
        console.error("CostAvoidance fetch error:", error);
      }
    }
    fetchData();
  }, []);

  // --- Dynamic Operational Counts ---
  // Menunggu Validasi (REGISTERED or VALIDATED)
  const menungguValidasiCount = equipments.filter(
    (e: Equipment) => e.status?.name === "REGISTERED" || e.status?.name === "VALIDATED" || e.statusAset === "REGISTERED" || e.statusAset === "VALIDATED"
  ).length;

  // Dalam Perbaikan (REJECTED or DALAM_PERBAIKAN or REPAIR)
  const dalamPerbaikanCount = equipments.filter(
    (e: Equipment) => e.status?.name === "REJECTED" || e.status?.name === "DALAM_PERBAIKAN" || e.status?.name === "REPAIR" || e.statusAset === "REJECTED"
  ).length;

  // Ready to Reuse (READY_TO_REUSE or IDLE)
  const readyCount = equipments.filter(
    (e: Equipment) => e.status?.name === "READY_TO_REUSE" || e.status?.name === "IDLE" || e.statusAset === "READY_TO_REUSE" || e.statusAset === "IDLE"
  ).length;

  // Menunggu Disposal
  const disposalCount = disposals.filter((d: Equipment) => d.status !== "DISPOSED").length;

  // --- Dynamic Recent Activities ---
  const sortedEquipments = [...equipments].sort((a: any, b: any) => {
    const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
    const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const recentActivities = sortedEquipments.slice(0, 4).map((e: any) => {
    const name = e.namaAlat || e.nama_alat || "Peralatan";
    const tag = e.kodeAlat || e.kode_alat || "";
    const status = e.status?.name || e.statusAset || "REGISTERED";
    
    let text = "";
    if (status === "REGISTERED") {
      text = `Peralatan ${name} (${tag}) baru diregistrasi oleh Rendal`;
    } else if (status === "VALIDATED") {
      text = `Inspeksi selesai: ${name} (${tag}) tervalidasi & menunggu approval`;
    } else if (status === "READY_TO_REUSE") {
      text = `Peralatan ${name} (${tag}) siap digunakan kembali (Ready to Reuse)`;
    } else if (status === "REJECTED") {
      text = `Peralatan ${name} (${tag}) selesai diinspeksi dengan status ditolak/revisi`;
    } else if (status === "IDLE") {
      text = `Aset ${name} (${tag}) disetujui manajer menjadi status IDLE`;
    } else {
      text = `Status peralatan ${name} (${tag}) diperbarui menjadi ${status.replace(/_/g, " ")}`;
    }
    
    const dateObj = new Date(e.updated_at || e.created_at || Date.now());
    const diffDays = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 3600 * 24));
    let timeStr = "Baru saja";
    if (diffDays === 0) {
      timeStr = "Hari ini";
    } else if (diffDays === 1) {
      timeStr = "Kemarin";
    } else if (diffDays > 1) {
      timeStr = `${diffDays} hari yang lalu`;
    }
    
    return { text, time: timeStr };
  });

  // Fallback logs if no data exists
  if (recentActivities.length === 0) {
    recentActivities.push(
      { text: "Pompa Sentrifugal A-101 selesai diperbaiki", time: "Hari ini" },
      { text: "Control Valve B-202 diajukan untuk disposal", time: "Hari ini" },
      { text: "Motor Induksi C-303 berhasil direuse di Plant P-IB", time: "Kemarin" },
      { text: "Kompresor Udara D-404 masuk antrean inspeksi", time: "Kemarin" }
    );
  }

  // --- Donut Chart: Breakdown by Status (Counts) ---
  const pieData = [
    { name: "Menunggu Validasi", value: menungguValidasiCount, color: "#f59e0b" },
    { name: "Dalam Perbaikan", value: dalamPerbaikanCount, color: "#ef4444" },
    { name: "Siap Re-use / Idle", value: readyCount, color: "#10b981" },
    { name: "Disposal", value: disposalCount, color: "#8b5cf6" },
  ].filter((item) => item.value > 0);

  if (pieData.length === 0) {
    pieData.push({ name: "Tidak Ada Data", value: 1, color: "#e5e7eb" });
  }

  // --- Financial Calculations for Bottom Charts ---
  const idleEquipments = equipments.filter((e: Equipment) => e.status?.name === "IDLE");
  const readyEquipments = equipments.filter((e: Equipment) => e.status?.name === "READY_TO_REUSE");

  const potentialSavings = idleEquipments.reduce(
    (sum: number, e: Equipment) => sum + (Number(e.estimated_reuse_value) || 0),
    0
  );

  const realizedSavings = readyEquipments.reduce(
    (sum: number, e: Equipment) => sum + (Number(e.estimated_reuse_value) || 0),
    0
  );

  const disposalRecovery = disposals
    .filter((d: Equipment) => d.status === "DISPOSED")
    .reduce((sum: number, d: Equipment) => sum + (Number(d.scrap_value) || 0), 0);

  const totalCostAvoidance = potentialSavings + realizedSavings + disposalRecovery;

  // --- Bar Chart: Cost Avoidance by Plant ---
  const plantMap = new Map<string, { plant: string; potential: number; realized: number }>();
  equipments.forEach((e: Equipment) => {
    const plant = e.plant_description || e.plant || "Tidak Diketahui";
    const reuseValue = Number(e.estimated_reuse_value) || 0;
    if (!plantMap.has(plant)) {
      plantMap.set(plant, { plant, potential: 0, realized: 0 });
    }
    const entry = plantMap.get(plant)!;
    if (e.status?.name === "IDLE") entry.potential += reuseValue;
    if (e.status?.name === "READY_TO_REUSE") entry.realized += reuseValue;
  });
  const plantData = Array.from(plantMap.values())
    .sort((a, b) => b.potential + b.realized - a.potential - a.realized)
    .slice(0, 5); // top 5 plants to keep it compact

  // --- Area Chart: Monthly Trend ---
  const monthlyMap = new Map<string, { month: string; value: number; cumulative: number }>();
  let cumulativeTotal = 0;
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap.set(key, { month: monthNames[d.getMonth()], value: 0, cumulative: 0 });
  }

  equipments.forEach((e: Equipment) => {
    if (!e.created_at) return;
    const d = new Date(e.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthlyMap.has(key)) {
      const entry = monthlyMap.get(key)!;
      entry.value += Number(e.estimated_reuse_value) || 0;
    }
  });

  const monthlyData = Array.from(monthlyMap.values());
  monthlyData.forEach((entry) => {
    cumulativeTotal += entry.value;
    entry.cumulative = cumulativeTotal;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Operational KPI To-Do Cards at the Top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Menunggu Validasi */}
        <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-500/0 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Menunggu Validasi</p>
              <h3 className="text-2xl font-extrabold text-orange-600">{menungguValidasiCount}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Aset baru diajukan</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-50 text-orange-500 shrink-0">
              <Clock className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Card 2: Dalam Perbaikan */}
        <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/0 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Dalam Perbaikan</p>
              <h3 className="text-2xl font-extrabold text-red-600">{dalamPerbaikanCount}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Aset butuh pemeliharaan</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-500 shrink-0">
              <Wrench className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Card 3: Ready to Reuse */}
        <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ready to Reuse</p>
              <h3 className="text-2xl font-extrabold text-emerald-600">{readyCount}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Siap digunakan kembali</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-500 shrink-0">
              <CheckCircle className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>

        {/* Card 4: Menunggu Disposal */}
        <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/0 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Menunggu Disposal</p>
              <h3 className="text-2xl font-extrabold text-purple-600">{disposalCount}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Proses penghapusan aset</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 shrink-0">
              <Recycle className="w-5.5 h-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Action Items & Recent Activities (Left) vs Asset Status (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Action Items & Recent Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Perlu Tindakan */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Perlu Tindakan Hari Ini
            </h3>
            <div className="space-y-2.5">
              {menungguValidasiCount > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-700 bg-orange-50/50 p-2.5 rounded border border-orange-100/50">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-orange-950">{menungguValidasiCount} aset belum diverifikasi</span>. Lakukan inspeksi teknis segera untuk kelayakan idle.
                  </div>
                </div>
              )}
              {dalamPerbaikanCount > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-700 bg-red-50/50 p-2.5 rounded border border-red-100/50">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-red-950">{dalamPerbaikanCount} pemeliharaan/perbaikan aktif</span>. Pantau kelancaran servis peralatan agar siap direuse.
                  </div>
                </div>
              )}
              {disposalCount > 0 && (
                <div className="flex items-start gap-2 text-sm text-gray-700 bg-purple-50/50 p-2.5 rounded border border-purple-100/50">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-purple-950">{disposalCount} disposal menunggu approval</span>. Harap tindak lanjuti usulan pelelangan/disposal.
                  </div>
                </div>
              )}
              {menungguValidasiCount === 0 && dalamPerbaikanCount === 0 && disposalCount === 0 && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50/50 p-3 rounded border border-emerald-100">
                  <Check className="w-4 h-4" />
                  <span>Semua pekerjaan operasional bersih! Tidak ada tindakan mendesak hari ini.</span>
                </div>
              )}
            </div>
          </div>

          {/* Aktivitas Terbaru */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Aktivitas Terbaru
            </h3>
            <div className="divide-y divide-gray-100">
              {recentActivities.map((act, index) => (
                <div key={index} className="py-2.5 flex items-start gap-3 first:pt-0 last:pb-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] text-gray-700 font-medium">{act.text}</p>
                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Donut Status Aset (Jumlah Unit) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Status Aset</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Distribusi aset berdasarkan kondisi operasional saat ini</p>
          </div>
          
          <div className="relative h-40 flex justify-center items-center mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => `${value} Unit`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-gray-800">
                {equipments.length}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Unit</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-600 font-semibold">{item.name}</span>
                </div>
                <span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-xs">
                  {item.value} Unit ({Math.round((item.value / (equipments.length || 1)) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <hr className="border-gray-200/60 my-2" />

      {/* 3. Executive Analytic Charts at the Bottom (Smaller & Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Plant Savings Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Penghematan Biaya per Plant</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Nilai optimalisasi aset per lokasi pabrik</p>
            </div>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors">
              Semua Plant
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plantData.length > 0 ? plantData : [{ plant: "No Data", potential: 0, realized: 0 }]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="plant"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  dy={5}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  tickFormatter={(v) => formatCurrency(v)}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => formatCurrency(Number(value) || 0)}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }}
                  iconType="circle"
                  iconSize={6}
                />
                <Bar dataKey="realized" name="Terealisasi" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={25} />
                <Bar dataKey="potential" name="Potensi" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Tren Penghematan Biaya Bulanan</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Akumulasi nilai optimalisasi aset 6 bulan terakhir</p>
            </div>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors">
              6 Bulan Terakhir
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0556B3" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0556B3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickFormatter={(v) => formatCurrency(v)}
                  width={60}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => formatCurrency(Number(value) || 0)}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }}
                  iconType="circle"
                  iconSize={6}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Nilai Bulanan"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMonthly)"
                  activeDot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 1.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Akumulasi"
                  stroke="#0556B3"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCumulative)"
                  activeDot={{ r: 4, fill: "#0556B3", stroke: "#fff", strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
