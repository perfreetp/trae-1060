import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CloudRain,
  Waves,
  Droplets,
  GitBranch,
  MessageSquare,
  FileBarChart,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "流域总览", icon: LayoutDashboard },
  { path: "/rainfall", label: "雨量站", icon: CloudRain },
  { path: "/river", label: "河道水位", icon: Waves },
  { path: "/reservoir/res-001", label: "单库详情", icon: Droplets },
  { path: "/scheme", label: "联合调度方案", icon: GitBranch },
  { path: "/command", label: "调度指令", icon: MessageSquare },
  { path: "/review", label: "复盘评估", icon: FileBarChart },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary-600 flex items-center gap-2">
          <Waves className="w-6 h-6" />
          流域调度系统
        </h1>
      </div>
      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">系统状态</div>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-600">运行正常</span>
        </div>
      </div>
    </aside>
  );
}
