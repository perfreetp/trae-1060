import { useState } from "react";
import { CloudRain, Download, AlertTriangle } from "lucide-react";
import LineChart from "../components/Charts/LineChart";
import BasinMap from "../components/Map/BasinMap";
import { rainfallStations } from "../data/rainfall";
import { formatNumber, formatTime } from "../utils/format";

export default function Rainfall() {
  const [selectedStations, setSelectedStations] = useState<string[]>([
    "rain-001",
    "rain-002",
    "rain-004",
  ]);

  const hours = ["8h", "10h", "12h", "14h", "16h"];
  const colors = ["#3E92CC", "#F77F00", "#D62828", "#38B000", "#0096C7", "#8B5CF6"];

  const toggleStation = (id: string) => {
    setSelectedStations((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const chartData = rainfallStations
    .filter((s) => selectedStations.includes(s.id))
    .map((s, i) => ({
      name: s.name,
      values: s.hourlyRain,
      color: colors[i % colors.length],
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CloudRain className="w-6 h-6 text-primary-500" />
          雨量站监测
        </h2>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出数据
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4">雨量站点分布</h3>
            <BasinMap rainfallStations={rainfallStations} height="350px" />
          </div>
        </div>
        <div className="data-card">
          <h3 className="font-semibold text-gray-800 mb-4">过程线对比</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {rainfallStations.map((station, i) => (
              <button
                key={station.id}
                onClick={() => toggleStation(station.id)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedStations.includes(station.id)
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={{
                  backgroundColor: selectedStations.includes(station.id)
                    ? colors[i % colors.length]
                    : undefined,
                }}
              >
                {station.name}
              </button>
            ))}
          </div>
          <LineChart
            data={chartData}
            xAxisData={hours}
            yAxisName="mm"
            height={250}
          />
        </div>
      </div>

      <div className="data-card">
        <h3 className="font-semibold text-gray-800 mb-4">站点详情</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">站点名称</th>
                <th className="table-header">当前降雨 (mm/h)</th>
                <th className="table-header">日累计 (mm)</th>
                <th className="table-header">警戒值 (mm)</th>
                <th className="table-header">状态</th>
                <th className="table-header">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {rainfallStations.map((station) => (
                <tr
                  key={station.id}
                  className={station.isAlert ? "bg-red-50" : "hover:bg-gray-50"}
                >
                  <td className="table-cell font-medium">{station.name}</td>
                  <td className="table-cell font-mono">
                    {formatNumber(station.currentRain)}
                  </td>
                  <td className="table-cell font-mono">
                    {formatNumber(station.dailyRain)}
                  </td>
                  <td className="table-cell font-mono">{station.threshold}</td>
                  <td className="table-cell">
                    {station.isAlert ? (
                      <span className="flex items-center gap-1 text-alert-danger">
                        <AlertTriangle className="w-4 h-4" />
                        {station.alertLevel === "danger"
                          ? "超警戒"
                          : "接近警戒"}
                      </span>
                    ) : (
                      <span className="text-alert-success">正常</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-500">
                    {formatTime("2024-06-06 12:00:00")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
