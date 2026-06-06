import { Bell, User, Clock } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { formatTime } from "../../utils/format";

export default function Header() {
  const { currentUser, alerts } = useAppStore();
  const now = new Date();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {now.toLocaleDateString("zh-CN")} {formatTime(now.toISOString())}
          </span>
        </div>
        <span className="text-sm text-gray-400">|</span>
        <span className="text-sm text-primary-600 font-medium">汛期值班</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {alerts.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-alert-danger text-white text-xs rounded-full flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">
              {currentUser.name}
            </div>
            <div className="text-xs text-gray-500">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
