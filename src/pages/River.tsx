import { Waves, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import LineChart from "../components/Charts/LineChart";
import BasinMap from "../components/Map/BasinMap";
import { riverStations } from "../data/river";
import { formatNumber, formatTime, getTrendColor, getTrendIcon } from "../utils/format";

export default function River() {
  const hours = ["8h", "10h", "12h", "14h", "16h"];
  const colors = ["#3E92CC", "#F77F00", "#D62828", "#38B000", "#0096C7"];

  const chartData = riverStations.map((s, i) => ({
    name: s.name,
    values: s.hourlyLevel,
    color: colors[i % colors.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Waves className="w-6 h-6 text-primary-500" />
          河道水位监测
        </h2>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出数据
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {riverStations.map((station) => (
          <div key={station.id} className="data-card">
            <p className="text-sm text-gray-500 mb-1">{station.name}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-primary-600">
                {formatNumber(station.currentLevel)}
              </span>
              <span className="text-sm text-gray-500">m</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-mono ${getTrendColor(
                  station.trend
                )}`}
              >
                {getTrendIcon(station.trend)}
              </span>
              <span className="text-xs text-gray-500">
                警戒 {station.warningLevel}m
              </span>
            </div>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  station.currentLevel >= station.dangerLevel
                    ? "bg-red-500"
                    : station.currentLevel >= station.warningLevel
                    ? "bg-orange-500"
                    : "bg-primary-500"
                }`}
                style={{
                  width: `${Math.min(
                    (station.currentLevel / station.dangerLevel) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4">水位趋势对比</h3>
            <LineChart
              data={chartData}
              xAxisData={hours}
              yAxisName="水位 (m)"
              height={300}
            />
          </div>
        </div>
        <div className="data-card">
          <h3 className="font-semibold text-gray-800 mb-4">河道站点分布</h3>
          <BasinMap riverStations={riverStations} height="280px" />
        </div>
      </div>

      <div className="data-card">
        <h3 className="font-semibold text-gray-800 mb-4">站点详情</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">站点名称</th>
                <th className="table-header">当前水位 (m)</th>
                <th className="table-header">警戒水位 (m)</th>
                <th className="table-header">危险水位 (m)</th>
                <th className="table-header">趋势</th>
                <th className="table-header">状态</th>
                <th className="table-header">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {riverStations.map((station) => {
                const isWarning = station.currentLevel >= station.warningLevel;
                const isDanger = station.currentLevel >= station.dangerLevel;
                return (
                  <tr
                    key={station.id}
                    className={isDanger ? "bg-red-50" : isWarning ? "bg-orange-50" : "hover:bg-gray-50"}
                  >
                    <td className="table-cell font-medium">{station.name}</td>
                    <td className="table-cell font-mono font-medium">
                      {formatNumber(station.currentLevel)}
                    </td>
                    <td className="table-cell font-mono">
                      {station.warningLevel}
                    </td>
                    <td className="table-cell font-mono">
                      {station.dangerLevel}
                    </td>
                    <td className="table-cell">
                      <span className={getTrendColor(station.trend)}>
                        {station.trend === "up" && (
                          <TrendingUp className="w-4 h-4 inline" />
                        )}
                        {station.trend === "down" && (
                          <TrendingDown className="w-4 h-4 inline" />
                        )}
                        {station.trend === "stable" && (
                          <Minus className="w-4 h-4 inline" />
                        )}
                        <span className="ml-1 text-sm">
                          {station.trend === "up"
                            ? "上涨"
                            : station.trend === "down"
                            ? "下降"
                            : "平稳"}
                        </span>
                      </span>
                    </td>
                    <td className="table-cell">
                      {isDanger ? (
                        <span className="status-badge bg-red-100 text-red-800">
                          超危险
                        </span>
                      ) : isWarning ? (
                        <span className="status-badge bg-orange-100 text-orange-800">
                          超警戒
                        </span>
                      ) : (
                        <span className="status-badge bg-green-100 text-green-800">
                          正常
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-gray-500">
                      {formatTime(station.updateTime)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
