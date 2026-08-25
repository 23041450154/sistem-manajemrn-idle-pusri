import { Plus } from "lucide-react";

type Activity = {
  title: string;
  time: string;
  iconBg: string;
  iconColor: string;
};

/** Server Component — data dari RendalDashboard (satu fetch untuk semua anak). */
export function RecentActivities({
  equipments,
}: {
  equipments: Record<string, unknown>[];
}) {
  // just taking first 5 equipments as 'registered' activities
  const activities: Activity[] = (equipments || []).slice(0, 5).map((e) => ({
    title: `${String(e.name)} didaftarkan`,
    time: e.created_at
      ? new Date(String(e.created_at)).toLocaleDateString()
      : "Hari ini",
    iconBg: "bg-[#0556B3]",
    iconColor: "text-white",
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">Aktivitas Terakhir</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="space-y-6 flex-1 relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 z-0"></div>

          {activities.length > 0 ? (
            activities.map((item, idx) => (
              <div key={idx} className="flex gap-4 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white ${item.iconBg} ${item.iconColor} shadow-sm`}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-800 font-medium leading-tight">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4 relative z-10 bg-white">
              Belum ada aktivitas.
            </p>
          )}
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
