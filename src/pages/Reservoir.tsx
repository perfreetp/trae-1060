import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Droplets,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gauge,
  FileText,
  Plus,
} from "lucide-react";
import DualAxisChart from "../components/Charts/DualAxisChart";
import LineChart, { type ChartRef } from "../components/Charts/LineChart";
import TimeRangeSelector from "../components/Common/TimeRangeSelector";
import ExportButton from "../components/Common/ExportButton";
import { reservoirs, forecasts } from "../data/reservoir";
import { useAppStore } from "../store/useAppStore";
import { formatNumber, formatTime } from "../utils/format";

export default function Reservoir() {
  const { id } = useParams<{ id: string }>();
  const reservoir = reservoirs.find((r) => r.id === id) || reservoirs[0];
  const forecast = forecasts.find((f) => f.reservoirId === reservoir.id);
  const [selectedTab, setSelectedTab] = useState<"info" | "discharge" | "forecast">("info");
  const [opening, setOpening] = useState(50);
  const storageChartRef = useRef<ChartRef>(null);
  const inflowChartRef = useRef<ChartRef>(null);
  const dischargeChartRef = useRef<ChartRef>(null);
  const forecastChartRef = useRef<ChartRef>(null);
  const { timeRange } = useAppStore();

  const storageLevels = reservoir.storageCurve.map((p) => p.level.toString());
  const storageValues = reservoir.storageCurve.map((p) => p.storage);
  const dischargeOpenings = reservoir.dischargeCapacity.map((p) => p.opening.toString());
  const dischargeValues = reservoir.dischargeCapacity.map((p) => p.discharge);

  const forecastHours = forecast
    ? Array.from({ length: forecast.hours }, (_, i) => `${i + 1}h`)
    : [];

  const getDischargeForOpening = (open: number) => {
    const points = reservoir.dischargeCapacity;
    for (let i = 0; i < points.length - 1; i++) {
      if (open >= points[i].opening && open <= points[i + 1].opening) {
        const ratio = (open - points[i].opening) / (points[i + 1].opening - points[i].opening);
        return points[i].discharge + ratio * (points[i + 1].discharge - points[i].discharge);
      }
    }
    return 0;
  };

  const currentDischarge = getDischargeForOpening(opening);

  const storagePercent = (reservoir.currentStorage / reservoir.totalCapacity) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg">
            <Droplets className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{reservoir.name}</h2>
            <p className="text-sm text-gray-500">单库详细信息与调度操作</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector />
          <ExportButton
            chartRef={
              selectedTab === "info"
                ? storageChartRef
                : selectedTab === "discharge"
                ? dischargeChartRef
                : forecastChartRef
            }
            pageName="水库调度"
            entityName={reservoir.name}
            timeRange={timeRange}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="data-card">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-gray-500">当前水位</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-primary-600">
              {formatNumber(reservoir.currentLevel)}
            </span>
            <span className="text-sm text-gray-500">m</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            汛限 {reservoir.floodLimitLevel}m / 正常 {reservoir.normalLevel}m
          </p>
        </div>
        <div className="data-card">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-primary-500" />
            <span className="text-sm text-gray-500">当前库容</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-primary-600">
              {formatNumber(reservoir.currentStorage / 10000, 2)}
            </span>
            <span className="text-sm text-gray-500">亿m³</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            占总库容 {formatNumber(storagePercent, 1)}%
          </p>
        </div>
        <div className="data-card">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownToLine className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">入库流量</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-green-600">
              {reservoir.inflow}
            </span>
            <span className="text-sm text-gray-500">m³/s</span>
          </div>
        </div>
        <div className="data-card">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpFromLine className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-500">出库流量</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-orange-600">
              {reservoir.outflow}
            </span>
            <span className="text-sm text-gray-500">m³/s</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "info", label: "库容曲线" },
          { key: "discharge", label: "泄流能力查询" },
          { key: "forecast", label: "来水预报录入" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === tab.key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTab === "info" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="data-card">
            <DualAxisChart
              ref={storageChartRef}
              leftData={storageValues}
              rightData={reservoir.storageCurve.map((_, i) => i * 100)}
              xAxisData={storageLevels}
              leftName="库容 (万m³)"
              rightName="泄量 (m³/s)"
              title="水位-库容关系曲线"
              height={350}
            />
          </div>
          <div className="data-card">
            <LineChart
              ref={inflowChartRef}
              data={[
                {
                  name: "入库流量",
                  values: [280, 300, 320, 310, 330, 350, 340],
                  color: "#38B000",
                },
                {
                  name: "出库流量",
                  values: [250, 260, 280, 280, 290, 300, 290],
                  color: "#F77F00",
                },
              ]}
              xAxisData={["1日", "2日", "3日", "4日", "5日", "6日", "7日"]}
              title="近7日出入库流量"
              yAxisName="m³/s"
              height={350}
            />
          </div>
        </div>
      )}

      {selectedTab === "discharge" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-6">泄流能力查询</h3>
            <div className="mb-6">
              <label className="block text-sm text-gray-600 mb-3">
                闸门开度: <span className="font-bold text-primary-600">{opening}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={opening}
                onChange={(e) => setOpening(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-1">预计泄流量</p>
              <p className="text-3xl font-bold font-mono text-primary-600">
                {formatNumber(currentDischarge, 0)}
                <span className="text-lg ml-1">m³/s</span>
              </p>
            </div>
          </div>
          <div className="data-card">
            <LineChart
              ref={dischargeChartRef}
              data={[
                {
                  name: "泄流量",
                  values: dischargeValues,
                  color: "#F77F00",
                },
              ]}
              xAxisData={dischargeOpenings.map((v) => v + "%")}
              title="闸门开度-泄流量曲线"
              yAxisName="m³/s"
              height={350}
              showLegend={false}
            />
          </div>
        </div>
      )}

      {selectedTab === "forecast" && (
        <div className="space-y-6">
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">来水预报</h3>
              <button className="btn-primary flex items-center gap-2 text-sm py-1.5">
                <Plus className="w-4 h-4" />
                新增预报
              </button>
            </div>
            {forecast ? (
              <>
                <div className="flex items-center gap-6 mb-4 text-sm">
                  <span className="text-gray-500">
                    预报时长: <span className="text-gray-800 font-medium">{forecast.hours}小时</span>
                  </span>
                  <span className="text-gray-500">
                    创建人: <span className="text-gray-800 font-medium">{forecast.creator}</span>
                  </span>
                  <span className="text-gray-500">
                    创建时间: <span className="text-gray-800 font-medium">{formatTime(forecast.createTime)}</span>
                  </span>
                </div>
                <LineChart
                  ref={forecastChartRef}
                  data={[
                    {
                      name: "预报入库流量",
                      values: forecast.inflowData,
                      color: "#3E92CC",
                    },
                  ]}
                  xAxisData={forecastHours}
                  title={`未来${forecast.hours}小时来水预报`}
                  yAxisName="m³/s"
                  height={300}
                  showLegend={false}
                />
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无来水预报数据</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
