import { useState, useRef, useMemo } from "react";
import { CloudRain, AlertTriangle } from "lucide-react";
import LineChart, { type ChartRef } from "../components/Charts/LineChart";
import BasinMap from "../components/Map/BasinMap";
import TimeRangeSelector from "../components/Common/TimeRangeSelector";
import ExportButton from "../components/Common/ExportButton";
import { rainfallStations } from "../data/rainfall";
import { useAppStore } from "../store/useAppStore";
import { formatNumber, formatTime } from "../utils/format";
import { generateTimeLabels, getDataCount, generateRandomSeries, calcStationRainfall } from "../utils/timeSeries";

export default function Rainfall() {
  const [selectedStations, setSelectedStations] = useState<string[]>([
    "rain-001",
    "rain-002",
    "rain-004",
  ]);
  const chartRef = useRef<ChartRef>(null);
  const { timeRange } = useAppStore();

  const colors = ["#3E92CC", "#F77F00", "#D62828", "#38B000", "#0096C7", "#8B5CF6"];
  const timeLabels = generateTimeLabels(timeRange);
  const dataCount = getDataCount(timeRange);

  const toggleStation = (id: string) => {
    setSelectedStations((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const stationData = useMemo(() => {
    return rainfallStations.map((s) => {
      const timeSeries = generateRandomSeries(s.currentRain, s.currentRain * 0.8, dataCount, s.isAlert ? "up" : "stable");
      const timeRangeData = calcStationRainfall({ ...s, timeSeries }, timeRange);
      return {
        ...s,
        timeSeries,
        timeRangeData,
      };
    });
  }, [timeRange, dataCount]);

  const chartData = stationData
    .filter((s) => selectedStations.includes(s.id))
    .map((s, i) => ({
      name: s.name,
      values: s.timeSeries,
      color: colors[i % colors.length],
    }));

  const tableHeaders = ["站点名称", "当前降雨 (mm/h)", "日累计 (mm)", "时段累计 (mm)", "警戒值 (mm)", "状态", "更新时间"];
  const tableRows = stationData.map((s) => [
    s.name,
    formatNumber(s.currentRain),
    formatNumber(s.dailyRain),
    formatNumber(s.timeRangeData?.totalRain ?? 0),
    s.threshold,
    s.isAlert ? (s.alertLevel === "danger" ? "超警戒" : "接近警戒") : "正常",
    formatTime("2024-06-06 12:00:00"),
  ]);

  const totalRain = stationData.reduce((sum, s) => sum + (s.timeRangeData?.totalRain ?? s.dailyRain), 0);
  const alertCount = stationData.filter((s) => s.isAlert).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CloudRain className="w-6 h-6 text-primary-500" />
          雨量站监测
        </h2>
        <div className="flex items-center gap-3">
          <TimeRangeSelector />
          <ExportButton
            chartRef={chartRef}
            pageName="雨量站监测"
            entityName="多站点对比"
            timeRange={timeRange}
            tableData={{ headers: tableHeaders, rows: tableRows }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="data-card">
          <p className="text-sm text-gray-500">监测站点</p>
          <p className="text-2xl font-bold text-gray-800 font-mono">{stationData.length}</p>
        </div>
        <div className="data-card">
          <p className="text-sm text-gray-500">累计降雨量</p>
          <p className="text-2xl font-bold text-primary-600 font-mono">{formatNumber(totalRain)} mm</p>
        </div>
        <div className="data-card">
          <p className="text-sm text-gray-500">超警站点</p>
          <p className="text-2xl font-bold text-alert-danger font-mono">{alertCount}</p>
        </div>
        <div className="data-card">
          <p className="text-sm text-gray-500">最大降雨</p>
          <p className="text-2xl font-bold text-alert-warning font-mono">
            {formatNumber(Math.max(...stationData.map((s) => s.dailyRain)))} mm
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4">雨量站点分布</h3>
            <BasinMap rainfallStations={stationData} height="350px" />
          </div>
        </div>
        <div className="data-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">过程线对比</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {stationData.map((station, i) => (
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
            ref={chartRef}
            data={chartData}
            xAxisData={timeLabels}
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
                {tableHeaders.map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stationData.map((station) => (
                <tr key={station.id}
                className={station.isAlert ? "bg-red-50" : "hover:bg-gray-50"}
              >
                <td className="table-cell font-medium">{station.name}</td>
                <td className="table-cell font-mono">
                  {formatNumber(station.currentRain)}
                </td>
                <td className="table-cell font-mono">
                  {formatNumber(station.dailyRain)}
                </td>
                <td className="table-cell font-mono font-medium text-primary-600">
                  {formatNumber(station.timeRangeData?.totalRain ?? 0)}
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
