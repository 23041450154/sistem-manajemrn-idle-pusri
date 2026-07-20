"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChevronDown } from "lucide-react";

const lineData = [
  { name: "Mei", value: 45 },
  { name: "Jun", value: 59 },
  { name: "Jul", value: 80 },
  { name: "Agu", value: 81 },
  { name: "Sep", value: 56 },
  { name: "Okt", value: 95 },
];

const pieData = [
  { name: "Siap Digunakan", value: 61, color: "#10b981" },
  { name: "Idle (Standby)", value: 33, color: "#2563eb" },
  { name: "Butuh Perbaikan", value: 4, color: "#ef4444" },
];

export function ChartSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Line Chart */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Tren Registrasi Peralatan</h3>
          <button className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
            6 Bulan Terakhir
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0556B3" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0556B3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0556B3"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
                activeDot={{ r: 6, fill: "#0556B3", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Distribusi Status</h3>
        <div className="relative h-48 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-800">1,284</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total Unit</span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {pieData.map((item) => (
            <div key={item.name} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600 font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-gray-800">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
