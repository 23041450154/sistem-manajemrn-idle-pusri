import { Plus, Edit2, AlertCircle, CheckCircle2, FileText } from "lucide-react";

export function RecentActivities() {
  const activities = [
    {
      title: "Pompa Sentrifugal P-102 didaftarkan oleh Rendal",
      time: "2 jam yang lalu",
      icon: Plus,
      iconBg: "bg-[#0556B3]",
      iconColor: "text-white",
    },
    {
      title: (
        <>
          Update status Compressor C-10 menjadi <span className="text-[#0556B3] font-medium">Idle</span>
        </>
      ),
      time: "5 jam yang lalu",
      icon: Edit2,
      iconBg: "bg-gray-500",
      iconColor: "text-white",
    },
    {
      title: "Motor Listrik M-5 memerlukan perbaikan segera",
      time: "Kemarin, 14:20",
      icon: AlertCircle,
      iconBg: "bg-red-500",
      iconColor: "text-white",
    },
    {
      title: "Inspeksi selesai untuk Valve V-401A",
      time: "Kemarin, 10:15",
      icon: CheckCircle2,
      iconBg: "bg-green-500",
      iconColor: "text-white",
    },
    {
      title: "Permintaan baru untuk Generator Set G-1",
      time: "2 hari yang lalu",
      icon: FileText,
      iconBg: "bg-amber-700",
      iconColor: "text-white",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">Aktivitas Terakhir</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="space-y-6 flex-1 relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 z-0"></div>

          {activities.map((item, idx) => (
            <div key={idx} className="flex gap-4 relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white ${item.iconBg} ${item.iconColor} shadow-sm`}
              >
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-gray-800 font-medium leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-6 mt-auto">
          <button className="w-full py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Lihat Semua Aktivitas
          </button>
        </div>
      </div>
    </div>
  );
}
