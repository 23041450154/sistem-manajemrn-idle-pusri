import { LucideIcon } from "lucide-react";

interface StatCardProps {
      title: string;
      value: string;
      icon: LucideIcon;
      iconBgColor: string;
      iconColor: string;
}

export function StatCard({
      title,
      value,
      icon: Icon,
      iconBgColor,
      iconColor,
}: StatCardProps) {
      return (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                        <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor} ${iconColor}`}
                        >
                              <Icon className="w-5 h-5" />
                        </div>
                  </div>
                  <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              {title}
                        </p>
                        <h3 className="text-3xl font-bold text-gray-800">
                              {value}
                        </h3>
                  </div>
            </div>
      );
}
