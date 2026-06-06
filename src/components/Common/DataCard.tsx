import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: React.ReactNode;
  color?: string;
}

export default function DataCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  color = "text-primary-600",
}: DataCardProps) {
  return (
    <div className="data-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono ${color}`}>
              {value}
            </span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" && (
                <TrendingUp className="w-4 h-4 text-red-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              {trend === "stable" && (
                <Minus className="w-4 h-4 text-gray-500" />
              )}
              <span
                className={`text-xs ${
                  trend === "up"
                    ? "text-red-500"
                    : trend === "down"
                    ? "text-green-500"
                    : "text-gray-500"
                }`}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg bg-primary-50 ${color}`}>{icon}</div>
        )}
      </div>
    </div>
  );
}
