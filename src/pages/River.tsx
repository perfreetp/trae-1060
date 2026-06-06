import { useRef, useMemo } from "react";
import { Waves, TrendingUp, TrendingDown, Minus } from "lucide-react";
import LineChart, { type ChartRef } from "../components/Charts/LineChart";
import BasinMap from "../components/Map/BasinMap";
import TimeRangeSelector from "../components/Common/TimeRangeSelector";
import ExportButton from "../components/Common/ExportButton";
import { riverStations } from "../data/river";
import { useAppStore } from "../store/useAppStore";
import { formatNumber, formatTime, getTrendColor, getTrendIcon } from "../utils/format";
import { generateTimeLabels, getDataCount, generateRandomSeries } from "../utils/timeSeries";

export default function River() {
  const chartRef = useRef<ChartRef>(null);
  const { timeRange } = useAppStore();

  const colors = ["#3E92CC", "#F77F00", "#D62828", "#38B000", "#0096C7"];
  const timeLabels = generateTimeLabels(timeRange);
  const dataCount = getDataCount(timeRange);

  const stationData = useMemo(() => {
    return riverStations.map((s) => ({
      ...s,
      timeSeries: generateRandomSeries(s.currentLevel, 0.5, dataCount, s.trend),
    }));
  }, [timeRange, dataCount]);

  const chartData = stationData.map((s, i) => ({
    name: s.name,
    values: s.timeSeries,
    color: colors[i % colors.length],
  }));

  const totalStations = stationData.length;
  const warningStations = stationData.filter(
    (s) => s.currentLevel >= s.warningLevel
  ).length;
  const maxLevel = Math.max(...stationData.map((s) => s.currentLevel));
  const avgLevel =
    stationData.reduce((sum, s) => sum + s.currentLevel, 0) / totalStations;

  const tableHeaders = [
    "站点名称",
    "当前水位 (m)",
    "警戒水位 (m)",
    "危险水位 (m)",
    "趋势",
    "状态",
    "更新时间",
  ];
  const tableRows = stationData.map((s) => [
    s.name,
    formatNumber(s.currentLevel),
    s.warningLevel,
    s.dangerLevel,
    s.trend === "up" ? "上涨" : s.trend === "down" ? "下降" : "平稳",
    s.currentLevel >= s.dangerLevel
      ? "超危险"
      : s.currentLevel >= s.warningLevel
      ? "超警戒"
      : "正常",
    formatTime(s.updateTime),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Waves className="w-6 h-6 text-primary-500" />
          河道水位监测
        </h2>
        <div className="flex items-center gap-3">
          <TimeRangeSelector />
          <ExportButton
            chartRef={chartRef}
            pageName="河道水位监测"
            entityName="多站点对比"
            timeRange={timeRange}
            tableData={{ headers: tableHeaders, rows: tableRows }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="data-card">
          <p className="text-sm text-gray-500">河道站数</p>
          <p className="text-2xl font-bold text-gray-800 font-mono">
            {totalStations}
          </p>
        </div>
        <div className="data-card">
          <p className="text-sm text-gray-500">超警站数</p>
          <p className="text-2xl font-bold text-alert-danger font-mono">
            {warningStations}
          </p>
        </div>
        <div className="data-card">
          <p className="text-sm text-gray-500">最高水位</p>
          <p className="text-2xl font-bold text-alert-warning font-mono">
            {formatNumber(maxLevel)} m
          </p>
        </div>
        <div className="data-card">
          <p className="text-sm text-gray-500">平均水位</p>
          <p className="text-2xl font-bold text-primary-600 font-mono">
            {formatNumber(avgLevel)} m
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4">水位趋势对比</h3>
            <LineChart
              ref={chartRef}
              data={chartData}
              xAxisData={timeLabels}
              yAxisName="水位 (m)"
              height={300}
            />
          </div>
        </div>
        <div className="data-card">
          <h3 className="font-semibold text-gray-800 mb-4">河道站点分布</h3>
          <BasinMap riverStations={stationData} height="280px" />
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
              {stationData.map((station) => {
                const isWarning = station.currentLevel >= station.warningLevel;
                const isDanger = station.currentLevel >= station.dangerLevel;
                return (
                  <tr
                    key={station.id}
                    className={
                      isDanger
                        ? "bg-red-50"
                        : isWarning
                        ? "bg-orange-50"
                        : "hover:bg-gray-50"
                    }
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
