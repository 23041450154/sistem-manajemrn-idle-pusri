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

  // --- Cost Avoidance Calculations ---
  const idleEquipments = equipments.filter((e: Equipment) => e.status?.name === "IDLE");
  const readyEquipments = equipments.filter((e: Equipment) => e.status?.name === "READY_TO_REUSE");
  const validatedEquipments = equipments.filter((e: Equipment) => e.status?.name === "VALIDATED");

  // Potential savings: idle equipment that could be reused
  const potentialSavings = idleEquipments.reduce(
    (sum: number, e: Equipment) => sum + (Number(e.estimated_reuse_value) || 0),
    0
  );

  // Realized savings: equipment already ready to reuse (avoided new purchase)
  const realizedSavings = readyEquipments.reduce(
    (sum: number, e: Equipment) => sum + (Number(e.estimated_reuse_value) || 0),
    0
  );

  // Disposal recovery: scrap/lelang value from disposed assets
  const disposalRecovery = disposals
    .filter((d: Equipment) => d.status === "DISPOSED")
    .reduce((sum: number, d: Equipment) => sum + (Number(d.scrap_value) || 0), 0);

  // Total cost avoidance
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
  const plantData = Array.from(plantMap.values()).sort((a, b) => b.potential + b.realized - a.potential - a.realized);

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

  // --- Donut Chart: Breakdown by Status ---
  const statusBreakdown = [
    {
      name: "Siap Re-use",
      value: readyEquipments.reduce((s: number, e: Equipment) => s + (Number(e.estimated_reuse_value) || 0), 0),
      color: "#10b981",
    },
    {
      name: "Idle (Potensial)",
      value: idleEquipments.reduce((s: number, e: Equipment) => s + (Number(e.estimated_reuse_value) || 0), 0),
      color: "#2563eb",
    },
    {
      name: "Tervalidasi",
      value: validatedEquipments.reduce((s: number, e: Equipment) => s + (Number(e.estimated_reuse_value) || 0), 0),
      color: "#8b5cf6",
    },
    {
      name: "Pemulihan Disposal",
      value: disposalRecovery,
      color: "#f59e0b",
    },
  ].filter((item) => item.value > 0);

  // Fallback if no data
  const hasData = totalCostAvoidance > 0;

  const summaryCards = [
    {
      title: "Total Penghematan Biaya",
      value: hasData ? formatCurrency(totalCostAvoidance) : "Rp 0",
      subtitle: `${equipments.length} aset terdaftar`,
      icon: TrendingUp,
      iconBg: "bg-blue-50",
      iconColor: "text-[#0556B3]",
      gradient: "from-blue-500/5 to-blue-500/0",
      accentBorder: "border-blue-100",
    },
    {
      title: "Potensi Penghematan",
      value: hasData ? formatCurrency(potentialSavings) : "Rp 0",
      subtitle: `${idleEquipments.length} aset idle`,
      icon: TrendingDown,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      gradient: "from-amber-500/5 to-amber-500/0",
      accentBorder: "border-amber-100",
    },
    {
      title: "Penghematan Terealisasi",
      value: hasData ? formatCurrency(realizedSavings) : "Rp 0",
      subtitle: `${readyEquipments.length} aset siap re-use`,
      icon: Wallet,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      gradient: "from-emerald-500/5 to-emerald-500/0",
      accentBorder: "border-emerald-100",
    },
    {
      title: "Pemulihan Disposal",
      value: hasData ? formatCurrency(disposalRecovery) : "Rp 0",
      subtitle: `${disposals.filter((d: Equipment) => d.status === "DISPOSED").length} aset terdisposal`,
      icon: Recycle,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      gradient: "from-purple-500/5 to-purple-500/0",
      accentBorder: "border-purple-100",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className={`bg-white rounded-xl border ${card.accentBorder} p-5 shadow-sm relative overflow-hidden group transition-all hover:shadow-md`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`} />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
                <p className="text-[11px] text-gray-500 mt-1">{card.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Cost Avoidance by Plant */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Penghematan Biaya per Plant</h3>
              <p className="text-xs text-gray-500 mt-0.5">Nilai optimalisasi aset per lokasi pabrik</p>
            </div>
            <button className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
              Semua Plant
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plantData.length > 0 ? plantData : [{ plant: "No Data", potential: 0, realized: 0 }]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="plant"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  dy={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(v) => formatCurrency(v)}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => formatCurrency(Number(value) || 0)}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="realized" name="Terealisasi" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="potential" name="Potensi" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Breakdown by Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Rincian Nilai Aset</h3>
          <p className="text-xs text-gray-500 mb-4">Distribusi nilai berdasarkan status</p>
          <div className="relative h-48 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown.length > 0 ? statusBreakdown : [{ name: "Tidak Ada Data", value: 1, color: "#e5e7eb" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => formatCurrency(Number(value) || 0)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-800">
                {hasData ? formatCurrency(totalCostAvoidance) : "Rp 0"}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total Nilai</span>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {(statusBreakdown.length > 0 ? statusBreakdown : [{ name: "Tidak Ada Data", value: 0, color: "#e5e7eb" }]).map((item) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-gray-800 text-xs">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chart: Monthly Trend */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Tren Penghematan Biaya Bulanan</h3>
            <p className="text-xs text-gray-500 mt-0.5">Akumulasi nilai optimalisasi aset 6 bulan terakhir</p>
          </div>
          <button className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
            6 Bulan Terakhir
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="h-64">
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
                tick={{ fontSize: 12, fill: "#6b7280" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v) => formatCurrency(v)}
                width={80}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                formatter={(value) => formatCurrency(Number(value) || 0)}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Nilai Bulanan"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMonthly)"
                activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Akumulasi"
                stroke="#0556B3"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCumulative)"
                activeDot={{ r: 5, fill: "#0556B3", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
