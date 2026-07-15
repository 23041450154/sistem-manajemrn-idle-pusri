export function UpcomingInspections() {
  const inspections = [
    {
      name: "Pompa Sentrifugal P-102",
      type: "Flow Rate Control",
      id: "ASSET-2024-001",
      dept: "Produksi IIB",
      date: "12 Nov 2024",
      status: "MENDATANG",
      statusColor: "bg-orange-100 text-orange-700",
    },
    {
      name: "Heat Exchanger E-500",
      type: "Cooling System",
      id: "ASSET-2023-452",
      dept: "Utilitas",
      date: "15 Nov 2024",
      status: "TERJADWAL",
      statusColor: "bg-green-100 text-green-700",
    },
    {
      name: "Compressor C-10",
      type: "Air Processing",
      id: "ASSET-2024-089",
      dept: "Pemeliharaan",
      date: "18 Nov 2024",
      status: "MENDATANG",
      statusColor: "bg-orange-100 text-orange-700",
    },
    {
      name: "Valve V-401A",
      type: "Steam Line",
      id: "ASSET-2022-112",
      dept: "Produksi IB",
      date: "20 Nov 2024",
      status: "TERJADWAL",
      statusColor: "bg-green-100 text-green-700",
    },
  ];

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
            {inspections.map((item, idx) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
