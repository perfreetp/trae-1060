import { Clock } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import type { TimeRange } from "../../types";

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: "6h", label: "近6小时" },
  { value: "24h", label: "近24小时" },
  { value: "3d", label: "近3天" },
  { value: "7d", label: "近7天" },
];

export default function TimeRangeSelector() {
  const { timeRange, setTimeRange } = useAppStore();

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
      <Clock className="w-4 h-4 text-gray-500 ml-2" />
      <div className="flex gap-1">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              timeRange === range.value
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
