"use client";
import { useEffect, useState } from "react";
import { getInspections, getObjectTypes } from "@/action/api";

export function UpcomingInspections() {
  const [inspections, setInspections] = useState<any[]>([]);

  useEffect(() => {
    async function fetch() {
      try {
        const [data, objTypes] = await Promise.all([
          getInspections(),
          getObjectTypes()
        ]);
        if (data) {
          // just taking first 5 if available
          setInspections(data.slice(0, 5).map((d: any) => {
            let typeName = "Tipe";
            const eq = d.equipment;
            if (eq) {
              if (eq.object_type?.name) typeName = eq.object_type.name;
              else if (eq.objectType?.name) typeName = eq.objectType.name;
              else {
                const otId = eq.id_object_type || eq.object_type_id || eq.objectTypeId;
                if (otId && objTypes) {
                  const found = objTypes.find((o: any) => o.id === otId || o.id === Number(otId));
                  if (found) typeName = found.name;
                }
              }
            }
            
            return {
              name: eq?.name || "Peralatan",
              type: typeName,
              id: eq?.equipment_code || "-",
              dept: eq?.plant || "-",
              date: d.inspection_date ? new Date(d.inspection_date).toLocaleDateString() : "-",
              status: d.inspection_status || "MENDATANG",
              statusColor: "bg-orange-100 text-orange-700",
            };
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetch();
  }, []);


  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Jadwal Inspeksi Mendatang</h3>
        <button className="text-sm font-medium text-[#0556B3] hover:underline">
          Lihat Semua
        </button>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 border-b border-gray-100">Nama Peralatan</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 border-b border-gray-100">ID Aset</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 border-b border-gray-100">Departemen</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 border-b border-gray-100">Tanggal Inspeksi</th>
              <th className="py-3 px-6 text-xs font-semibold text-gray-500 border-b border-gray-100">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inspections.length > 0 ? (
              inspections.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.type}</p>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{item.id}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{item.dept}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{item.date}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 px-6 text-center text-gray-500 text-sm">
                  Tidak ada inspeksi mendatang atau belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
