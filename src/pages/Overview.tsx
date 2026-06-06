import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CloudRain,
  Waves,
  Droplets,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Calendar,
} from "lucide-react";
import DataCard from "../components/Common/DataCard";
import AlertPanel from "../components/Common/AlertPanel";
import BasinMap from "../components/Map/BasinMap";
import LineChart from "../components/Charts/LineChart";
import { useAppStore } from "../store/useAppStore";
import { reservoirs } from "../data/reservoir";
import { rainfallStations } from "../data/rainfall";
import { riverStations } from "../data/river";
import { formatNumber } from "../utils/format";
import type { TimeRange } from "../types";

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "6h", label: "近6小时" },
  { value: "24h", label: "近24小时" },
  { value: "3d", label: "近3天" },
  { value: "7d", label: "近7天" },
];

interface ComparisonData {
  rainfall: {
    base: number;
    compare: number;
    diff: number;
    percent: number;
    trend: "up" | "down" | "stable";
  };
  waterLevel: {
    base: number;
    compare: number;
    diff: number;
    trend: "up" | "down" | "stable";
  };
  storage: {
    base: number;
    compare: number;
    diff: number;
    percent: number;
    trend: "up" | "down" | "stable";
  };
  alerts: {
    base: number;
    compare: number;
    diff: number;
    trend: "up" | "down" | "stable";
  };
}

interface RankItem {
  id: string;
  name: string;
  value: number;
  diff: number;
  percent?: number;
  unit: string;
  trend: "up" | "down";
}

interface RiskChange {
  id: string;
  name: string;
  type: "new" | "resolved";
  description: string;
}

interface DetailData {
  rainfallRank: RankItem[];
  waterLevelRank: RankItem[];
  storageRank: RankItem[];
  riskChanges: RiskChange[];
}

const generateMockData = (
  baseRange: TimeRange,
  compareRange: TimeRange
): ComparisonData => {
  const rangeFactors: Record<TimeRange, number> = {
    "6h": 1,
    "24h": 4,
    "3d": 12,
    "7d": 28,
  };

  const baseFactor = rangeFactors[baseRange];
  const compareFactor = rangeFactors[compareRange];

  const baseRainfall = 12.5 * baseFactor;
  const compareRainfall = 15.8 * compareFactor;
  const rainfallDiff = compareRainfall - baseRainfall;
  const rainfallPercent = (rainfallDiff / baseRainfall) * 100;

  const baseWaterLevel = 42.3;
  const compareWaterLevel = 43.1;
  const waterLevelDiff = compareWaterLevel - baseWaterLevel;

  const baseStorage = 125.6;
  const compareStorage = 128.3;
  const storageDiff = compareStorage - baseStorage;
  const storagePercent = (storageDiff / baseStorage) * 100;

  const baseAlerts = 3;
  const compareAlerts = 5;
  const alertsDiff = compareAlerts - baseAlerts;

  const getTrend = (diff: number): "up" | "down" | "stable" => {
    if (diff > 0.1) return "up";
    if (diff < -0.1) return "down";
    return "stable";
  };

  return {
    rainfall: {
      base: baseRainfall,
      compare: compareRainfall,
      diff: rainfallDiff,
      percent: rainfallPercent,
      trend: getTrend(rainfallDiff),
    },
    waterLevel: {
      base: baseWaterLevel,
      compare: compareWaterLevel,
      diff: waterLevelDiff,
      trend: getTrend(waterLevelDiff),
    },
    storage: {
      base: baseStorage,
      compare: compareStorage,
      diff: storageDiff,
      percent: storagePercent,
      trend: getTrend(storageDiff),
    },
    alerts: {
      base: baseAlerts,
      compare: compareAlerts,
      diff: alertsDiff,
      trend: getTrend(alertsDiff),
    },
  };
};

const generateDetailData = (
  baseRange: TimeRange,
  compareRange: TimeRange
): DetailData => {
  const rangeFactors: Record<TimeRange, number> = {
    "6h": 1,
    "24h": 4,
    "3d": 12,
    "7d": 28,
  };

  const factorRatio = rangeFactors[compareRange] / rangeFactors[baseRange];

  const rainfallRank = rainfallStations
    .map((station) => {
      const baseRain = station.dailyRain * (1 / factorRatio) * (0.8 + Math.random() * 0.4);
      const compareRain = station.dailyRain * (0.9 + Math.random() * 0.3);
      const diff = compareRain - baseRain;
      const percent = baseRain > 0 ? (diff / baseRain) * 100 : 0;
      return {
        id: station.id,
        name: station.name,
        value: compareRain,
        diff,
        percent,
        unit: "mm",
        trend: (diff >= 0 ? "up" : "down") as "up" | "down",
      };
    })
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .slice(0, 3);

  const waterLevelRank = riverStations
    .map((station) => {
      const baseLevel = station.currentLevel - (0.2 + Math.random() * 0.8);
      const compareLevel = station.currentLevel;
      const diff = compareLevel - baseLevel;
      return {
        id: station.id,
        name: station.name,
        value: compareLevel,
        diff,
        unit: "m",
        trend: (diff >= 0 ? "up" : "down") as "up" | "down",
      };
    })
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);

  const storageRank = reservoirs
    .map((reservoir) => {
      const baseStorage = reservoir.currentStorage * (0.95 + Math.random() * 0.08);
      const compareStorage = reservoir.currentStorage;
      const diff = (compareStorage - baseStorage) / 10000;
      return {
        id: reservoir.id,
        name: reservoir.name,
        value: compareStorage / 10000,
        diff,
        unit: "亿m³",
        trend: (diff >= 0 ? "up" : "down") as "up" | "down",
      };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  const riskChanges: RiskChange[] = [
    {
      id: "risk-new-001",
      name: "襄阳雨量站超警",
      type: "new",
      description: "降雨量超过警戒值50mm",
    },
    {
      id: "risk-new-002",
      name: "沙市水位接近警戒",
      type: "new",
      description: "水位41.8m，距警戒值1.2m",
    },
    {
      id: "risk-resolved-001",
      name: "荆门雨量站解除预警",
      type: "resolved",
      description: "降雨量回落至正常范围",
    },
  ];

  return {
    rainfallRank,
    waterLevelRank,
    storageRank,
    riskChanges,
  };
};

const generateChartData = (range: TimeRange) => {
  const dataPoints: Record<TimeRange, number> = {
    "6h": 6,
    "24h": 12,
    "3d": 18,
    "7d": 28,
  };
  const count = dataPoints[range];

  const xLabels: Record<TimeRange, string[]> = {
    "6h": ["2h前", "1h前", "现在", "1h后", "2h后", "3h后"],
    "24h": ["0时", "4时", "8时", "12时", "16时", "20时", "现在"],
    "3d": ["第1天", "第2天", "第3天", "第4天", "第5天", "第6天", "现在"],
    "7d": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  };

  const rainfallValues = Array.from(
    { length: Math.min(count, 7) },
    () => Math.random() * 20 + 5
  );
  const waterLevelValues = Array.from(
    { length: Math.min(count, 7) },
    () => 40 + Math.random() * 5
  );

  return {
    xAxisData: xLabels[range].slice(0, Math.min(count, 7)),
    rainfallValues,
    waterLevelValues,
  };
};

export default function Overview() {
  const navigate = useNavigate();
  const { alerts } = useAppStore();

  const [baseTimeRange, setBaseTimeRange] = useState<TimeRange>("24h");
  const [compareTimeRange, setCompareTimeRange] = useState<TimeRange>("6h");

  const comparisonData = generateMockData(baseTimeRange, compareTimeRange);
  const detailData = generateDetailData(baseTimeRange, compareTimeRange);
  const chartData = generateChartData(compareTimeRange);

  const totalRainfall = rainfallStations.reduce(
    (sum, s) => sum + s.dailyRain,
    0
  );
  const avgWaterLevel =
    riverStations.reduce((sum, s) => sum + s.currentLevel, 0) /
    riverStations.length;
  const totalStorage = reservoirs.reduce(
    (sum, r) => sum + r.currentStorage,
    0
  );
  const alertCount = alerts.filter((a) => a.level !== "info").length;

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-red-500";
      case "down":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUp className="w-5 h-5" />;
      case "down":
        return <ArrowDown className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-red-500 text-white";
      case 1:
        return "bg-orange-500 text-white";
      case 2:
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  const TimeRangeSelect = ({
    value,
    onChange,
    label,
  }: {
    value: TimeRange;
    onChange: (v: TimeRange) => void;
    label: string;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
        <Calendar className="w-4 h-4 text-gray-400 ml-2" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as TimeRange)}
          className="bg-transparent text-sm text-gray-700 pr-2 py-1 focus:outline-none cursor-pointer"
        >
          {timeRangeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const ComparisonCard = ({
    title,
    icon,
    baseValue,
    compareValue,
    diff,
    unit,
    percent,
    trend,
    showPercent = true,
    navigatePath,
  }: {
    title: string;
    icon: React.ReactNode;
    baseValue: number;
    compareValue: number;
    diff: number;
    unit: string;
    percent?: number;
    trend: "up" | "down" | "stable";
    showPercent?: boolean;
    navigatePath: string;
  }) => (
    <div className="data-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
            {icon}
          </div>
          <h4 className="font-medium text-gray-800">{title}</h4>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">对比期值</p>
            <p className="text-2xl font-bold text-gray-800 font-mono">
              {formatNumber(compareValue, 1)}
              <span className="text-sm text-gray-500 ml-1">{unit}</span>
            </p>
          </div>
          <div
            className={`flex items-center gap-1 ${getTrendColor(trend)} font-medium`}
          >
            {getTrendIcon(trend)}
            <span className="text-lg">
              {showPercent && percent !== undefined
                ? `${percent > 0 ? "+" : ""}${formatNumber(percent, 1)}%`
                : `${diff > 0 ? "+" : ""}${formatNumber(diff, 2)}${unit}`}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              基准期: {formatNumber(baseValue, 1)}
              {unit}
            </span>
            <span className="text-gray-400">
              差值: {diff > 0 ? "+" : ""}
              {formatNumber(diff, 2)}
              {unit}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate(navigatePath)}
        className="mt-4 w-full py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-1 group-hover:gap-2"
      >
        查看详情
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );

  const RankCard = ({
    title,
    icon,
    iconBg,
    iconColor,
    data,
    showPercent,
    onItemClick,
  }: {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    data: RankItem[];
    showPercent?: boolean;
    onItemClick: (item: RankItem) => void;
  }) => (
    <div className="data-card hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <h4 className="font-medium text-gray-800">{title}</h4>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
          >
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${getRankBadgeColor(index)}`}
            >
              #{index + 1}
            </span>
            <span className="flex-1 text-sm text-gray-700 group-hover:underline group-hover:text-primary-600 transition-colors">
              {item.name}
            </span>
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                item.trend === "up" ? "text-red-500" : "text-green-500"
              }`}
            >
              {item.trend === "up" ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {showPercent && item.percent !== undefined
                ? `${formatNumber(item.percent, 1)}%`
                : `${item.diff > 0 ? "+" : ""}${formatNumber(item.diff, 2)}${
                    item.unit
                  }`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const RiskChangeCard = ({
    data,
    onItemClick,
  }: {
    data: RiskChange[];
    onItemClick: (item: RiskChange) => void;
  }) => {
    const newRisks = data.filter((d) => d.type === "new");
    const resolvedRisks = data.filter((d) => d.type === "resolved");

    return (
      <div className="data-card hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="font-medium text-gray-800">风险点变化追踪</h4>
        </div>
        <div className="space-y-4">
          {newRisks.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">新增风险点</p>
              <div className="space-y-2">
                {newRisks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-red-50 cursor-pointer group transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 group-hover:underline group-hover:text-red-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {resolvedRisks.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">解除风险点</p>
              <div className="space-y-2">
                {resolvedRisks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-green-50 cursor-pointer group transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 group-hover:underline group-hover:text-green-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleRainfallClick = (item: RankItem) => {
    navigate(`/rainfall?highlight=${item.id}`);
  };

  const handleWaterLevelClick = (item: RankItem) => {
    navigate(`/river?highlight=${item.id}`);
  };

  const handleStorageClick = (item: RankItem) => {
    navigate(`/reservoir/${item.id}?compareRange=${compareTimeRange}`);
  };

  const handleRiskClick = (item: RiskChange) => {
    navigate(`/scheme?highlight=${item.id}&type=${item.type}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">流域总览</h2>
        <span className="text-sm text-gray-500">
          数据更新时间: {new Date().toLocaleString("zh-CN")}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <DataCard
          title="累计降雨量"
          value={formatNumber(totalRainfall / rainfallStations.length, 1)}
          unit="mm"
          icon={<CloudRain className="w-6 h-6" />}
          trend="up"
          trendValue="较昨日 +12%"
        />
        <DataCard
          title="平均水位"
          value={formatNumber(avgWaterLevel, 1)}
          unit="m"
          icon={<Waves className="w-6 h-6" />}
          trend="up"
          trendValue="上涨 0.3m"
        />
        <DataCard
          title="总库容"
          value={formatNumber(totalStorage / 10000, 2)}
          unit="亿m³"
          icon={<Droplets className="w-6 h-6" />}
          trend="stable"
          trendValue="占总库容 68%"
        />
        <DataCard
          title="超警站点"
          value={alertCount}
          unit="个"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="text-alert-danger"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="data-card h-full">
            <h3 className="font-semibold text-gray-800 mb-4">流域分布图</h3>
            <BasinMap
              reservoirs={reservoirs}
              rainfallStations={rainfallStations}
              riverStations={riverStations}
              height="450px"
            />
          </div>
        </div>
        <div className="space-y-6">
          <AlertPanel alerts={alerts} />
        </div>
      </div>

      <div className="data-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary-500 rounded-full"></span>
            变化追踪
          </h3>
          <div className="flex items-center gap-6">
            <TimeRangeSelect
              value={baseTimeRange}
              onChange={setBaseTimeRange}
              label="基准期:"
            />
            <div className="text-gray-300">VS</div>
            <TimeRangeSelect
              value={compareTimeRange}
              onChange={setCompareTimeRange}
              label="对比期:"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <ComparisonCard
            title="雨量变化"
            icon={<CloudRain className="w-5 h-5" />}
            baseValue={comparisonData.rainfall.base}
            compareValue={comparisonData.rainfall.compare}
            diff={comparisonData.rainfall.diff}
            unit="mm"
            percent={comparisonData.rainfall.percent}
            trend={comparisonData.rainfall.trend}
            navigatePath={`/rainfall?compareRange=${compareTimeRange}`}
          />
          <ComparisonCard
            title="水位涨幅"
            icon={<Waves className="w-5 h-5" />}
            baseValue={comparisonData.waterLevel.base}
            compareValue={comparisonData.waterLevel.compare}
            diff={comparisonData.waterLevel.diff}
            unit="m"
            trend={comparisonData.waterLevel.trend}
            showPercent={false}
            navigatePath={`/river?compareRange=${compareTimeRange}`}
          />
          <ComparisonCard
            title="库容变化"
            icon={<Droplets className="w-5 h-5" />}
            baseValue={comparisonData.storage.base}
            compareValue={comparisonData.storage.compare}
            diff={comparisonData.storage.diff}
            unit="亿m³"
            percent={comparisonData.storage.percent}
            trend={comparisonData.storage.trend}
            navigatePath={`/reservoir/res-001?compareRange=${compareTimeRange}`}
          />
          <ComparisonCard
            title="风险点增减"
            icon={<AlertTriangle className="w-5 h-5" />}
            baseValue={comparisonData.alerts.base}
            compareValue={comparisonData.alerts.compare}
            diff={comparisonData.alerts.diff}
            unit="个"
            trend={comparisonData.alerts.trend}
            showPercent={false}
            navigatePath={`/scheme?compareRange=${compareTimeRange}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <RankCard
            title="雨量增幅最大站点"
            icon={<CloudRain className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            data={detailData.rainfallRank}
            showPercent={true}
            onItemClick={handleRainfallClick}
          />
          <RankCard
            title="水位涨幅最大断面"
            icon={<Waves className="w-5 h-5" />}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
            data={detailData.waterLevelRank}
            showPercent={false}
            onItemClick={handleWaterLevelClick}
          />
          <RankCard
            title="库容变化最大水库"
            icon={<Droplets className="w-5 h-5" />}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            data={detailData.storageRank}
            showPercent={false}
            onItemClick={handleStorageClick}
          />
          <RiskChangeCard
            data={detailData.riskChanges}
            onItemClick={handleRiskClick}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="data-card">
          <LineChart
            data={[
              {
                name: "流域平均降雨",
                values: chartData.rainfallValues,
                color: "#3E92CC",
              },
            ]}
            xAxisData={chartData.xAxisData}
            title={`降雨趋势 (${
              timeRangeOptions.find((o) => o.value === compareTimeRange)?.label
            })`}
            yAxisName="mm"
            height={250}
            showLegend={false}
          />
        </div>
        <div className="data-card">
          <LineChart
            data={[
              {
                name: "宜昌站",
                values: chartData.waterLevelValues,
                color: "#F77F00",
              },
              {
                name: "沙市站",
                values: chartData.waterLevelValues.map((v) => v + 0.5),
                color: "#D62828",
              },
            ]}
            xAxisData={chartData.xAxisData}
            title={`关键站点水位趋势 (${
              timeRangeOptions.find((o) => o.value === compareTimeRange)?.label
            })`}
            yAxisName="m"
            height={250}
          />
        </div>
      </div>
    </div>
  );
}
