import { AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import type { AlertItem } from "../../types";
import { getLevelColor, formatTime } from "../../utils/format";

interface AlertPanelProps {
  alerts: AlertItem[];
  onDismiss?: (id: string) => void;
}

export default function AlertPanel({ alerts, onDismiss }: AlertPanelProps) {
  const getIcon = (level: string) => {
    if (level === "danger") return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (level === "warning") return <AlertCircle className="w-5 h-5 text-orange-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="data-card">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-alert-warning" />
        实时预警
      </h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border-l-4 bg-gray-50 ${
              alert.level === "danger"
                ? "border-red-500"
                : alert.level === "warning"
                ? "border-orange-500"
                : "border-blue-500"
            } ${alert.level === "danger" ? "animate-pulse-slow" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getIcon(alert.level)}
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{alert.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {alert.source} · {formatTime(alert.time)}
                  </p>
                </div>
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
