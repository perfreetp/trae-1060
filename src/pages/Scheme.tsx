import { useState, useMemo } from "react";
import {
  GitBranch,
  Play,
  AlertTriangle,
  MapPin,
  Droplets,
  Clock,
  ChevronDown,
} from "lucide-react";
import BasinMap from "../components/Map/BasinMap";
import StatusBadge from "../components/Common/StatusBadge";
import ExportButton from "../components/Common/ExportButton";
import { schemes } from "../data/command";
import { reservoirs } from "../data/reservoir";
import { downstreamSections } from "../data/section";
import type {
  ReservoirSimulationState,
  RiskPoint,
  DownstreamSection,
} from "../types";
import { formatNumber, formatTime } from "../utils/format";

export default function Scheme() {
  const [selectedScheme, setSelectedScheme] = useState(schemes[0]);
  const [showSchemeDropdown, setShowSchemeDropdown] = useState(false);
  const [highlightedReservoirId, setHighlightedReservoirId] = useState<
    string | null
  >(null);
  const [simulationStates, setSimulationStates] = useState<
    ReservoirSimulationState[]
  >(() =>
    reservoirs.map((res) => ({
      reservoirId: res.id,
      targetLevel: res.floodLimitLevel,
      discharge: res.outflow,
      startTime: "2024-06-06 08:00:00",
      endTime: "2024-06-07 20:00:00",
    }))
  );
  const [isSimulating, setIsSimulating] = useState(false);

  const timeOptions = [
    "2024-06-06 00:00:00",
    "2024-06-06 04:00:00",
    "2024-06-06 08:00:00",
    "2024-06-06 12:00:00",
    "2024-06-06 16:00:00",
    "2024-06-06 20:00:00",
    "2024-06-07 00:00:00",
    "2024-06-07 08:00:00",
    "2024-06-07 12:00:00",
    "2024-06-07 16:00:00",
    "2024-06-07 20:00:00",
    "2024-06-08 00:00:00",
    "2024-06-08 08:00:00",
  ];

  const sectionResults = useMemo(() => {
    return downstreamSections.map((section) => {
      let predictedLevel = section.baseLevel;
      simulationStates.forEach((state) => {
        const coefficient = section.influenceCoefficients[state.reservoirId] || 0;
        predictedLevel += state.discharge * coefficient;
      });

      let riskLevel: "low" | "medium" | "high" = "low";
      if (predictedLevel >= section.dangerLevel) {
        riskLevel = "high";
      } else if (predictedLevel >= section.warningLevel) {
        riskLevel = "medium";
      }

      return {
        ...section,
        predictedLevel: Math.round(predictedLevel * 10) / 10,
        riskLevel,
      };
    });
  }, [simulationStates]);

  const overallRiskLevel = useMemo(() => {
    const levels = sectionResults.map((s) => s.riskLevel);
    if (levels.includes("high")) return "high";
    if (levels.includes("medium")) return "medium";
    return "low";
  }, [sectionResults]);

  const riskPoints = useMemo(() => {
    const points: RiskPoint[] = [];
    sectionResults.forEach((section) => {
      if (section.riskLevel === "low") return;

      const pointCount = section.riskLevel === "high" ? 3 : 2;
      for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2;
        const distance = 0.15 + i * 0.05;
        points.push({
          id: `rp-${section.id}-${i}`,
          name: `${section.name}风险点${i + 1}`,
          lat: section.lat + Math.sin(angle) * distance,
          lng: section.lng + Math.cos(angle) * distance,
          level: section.riskLevel,
          description: `${section.name}断面水位${section.predictedLevel}m，${
            section.riskLevel === "high" ? "超危险水位" : "接近警戒水位"
          }`,
        });
      }
    });
    return points;
  }, [sectionResults]);

  const updateSimulationState = (
    reservoirId: string,
    updates: Partial<ReservoirSimulationState>
  ) => {
    setSimulationStates((prev) =>
      prev.map((state) =>
        state.reservoirId === reservoirId ? { ...state, ...updates } : state
      )
    );
  };

  const getRiskLevelInfo = (level: string) => {
    switch (level) {
      case "high":
        return { label: "高风险", color: "text-red-600", bg: "bg-red-100" };
      case "medium":
        return { label: "中风险", color: "text-orange-600", bg: "bg-orange-100" };
      default:
        return { label: "低风险", color: "text-green-600", bg: "bg-green-100" };
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1000);
  };

  const totalDischarge = simulationStates.reduce(
    (sum, s) => sum + s.discharge,
    0
  );
  const maxLevel = Math.max(...sectionResults.map((s) => s.predictedLevel));
  const riskLevelInfo = getRiskLevelInfo(overallRiskLevel);

  const exportTableData = {
    headers: ["断面名称", "预计水位(m)", "警戒水位(m)", "危险水位(m)", "风险等级"],
    rows: sectionResults.map((s) => [
      s.name,
      s.predictedLevel,
      s.warningLevel,
      s.dangerLevel,
      getRiskLevelInfo(s.riskLevel).label,
    ]),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg">
            <GitBranch className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">联合调度方案模拟</h2>
            <p className="text-sm text-gray-500">多水库联合调度方案仿真与风险评估</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSchemeDropdown(!showSchemeDropdown)}
              className="btn-secondary flex items-center gap-2 min-w-[240px] justify-between"
            >
              <span className="truncate">{selectedScheme.name}</span>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </button>
            {showSchemeDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[280px] max-h-80 overflow-y-auto">
                {schemes.map((scheme) => (
                  <button
                    key={scheme.id}
                    onClick={() => {
                      setSelectedScheme(scheme);
                      setShowSchemeDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${
                      selectedScheme.id === scheme.id ? "bg-primary-50" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {scheme.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        创建人: {scheme.creator} · {formatTime(scheme.createTime)}
                      </p>
                    </div>
                    <StatusBadge status={scheme.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="btn-primary flex items-center gap-2"
          >
            <Play className={`w-4 h-4 ${isSimulating ? "animate-pulse" : ""}`} />
            {isSimulating ? "模拟中..." : "运行模拟"}
          </button>
          <ExportButton
            pageName="联合调度方案"
            entityName="模拟结果"
            timeRange="24h"
            tableData={exportTableData}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-4">
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary-500" />
              水库参数调整
            </h3>
            <div className="space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
              {reservoirs.map((reservoir) => {
                const state = simulationStates.find(
                  (s) => s.reservoirId === reservoir.id
                );
                if (!state) return null;
                const isHighlighted = highlightedReservoirId === reservoir.id;

                return (
                  <div
                    key={reservoir.id}
                    onClick={() => setHighlightedReservoirId(reservoir.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isHighlighted
                        ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        {reservoir.name}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">目标水位</span>
                          <span className="font-mono font-medium text-primary-600">
                            {state.targetLevel} m
                          </span>
                        </div>
                        <input
                          type="range"
                          min={reservoir.floodLimitLevel - 5}
                          max={reservoir.normalLevel}
                          step={0.1}
                          value={state.targetLevel}
                          onChange={(e) =>
                            updateSimulationState(reservoir.id, {
                              targetLevel: Number(e.target.value),
                            })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{reservoir.floodLimitLevel - 5}m</span>
                          <span>{reservoir.normalLevel}m</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">泄流量</span>
                          <span className="font-mono font-medium text-orange-600">
                            {state.discharge} m³/s
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={reservoir.dischargeCapacity[5].discharge}
                          step={10}
                          value={state.discharge}
                          onChange={(e) =>
                            updateSimulationState(reservoir.id, {
                              discharge: Number(e.target.value),
                            })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0</span>
                          <span>
                            {reservoir.dischargeCapacity[5].discharge}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            开始时间
                          </label>
                          <select
                            value={state.startTime}
                            onChange={(e) =>
                              updateSimulationState(reservoir.id, {
                                startTime: e.target.value,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            {timeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t.slice(5, 16)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            结束时间
                          </label>
                          <select
                            value={state.endTime}
                            onChange={(e) =>
                              updateSimulationState(reservoir.id, {
                                endTime: e.target.value,
                              })
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            {timeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t.slice(5, 16)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                模拟结果概览
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevelInfo.bg} ${riskLevelInfo.color}`}>
                整体风险等级: {riskLevelInfo.label}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">预计最高水位</p>
                <p className="text-2xl font-bold font-mono text-primary-600">
                  {formatNumber(maxLevel, 1)}
                  <span className="text-sm font-normal ml-1">m</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">总下泄流量</p>
                <p className="text-2xl font-bold font-mono text-orange-600">
                  {formatNumber(totalDischarge, 0)}
                  <span className="text-sm font-normal ml-1">m³/s</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">风险断面数</p>
                <p className="text-2xl font-bold font-mono text-red-600">
                  {sectionResults.filter((s) => s.riskLevel !== "low").length}
                  <span className="text-sm font-normal ml-1">个</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">风险点总数</p>
                <p className="text-2xl font-bold font-mono text-yellow-600">
                  {riskPoints.length}
                  <span className="text-sm font-normal ml-1">个</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {sectionResults.map((section) => {
                const sectionRisk = getRiskLevelInfo(section.riskLevel);
                const levelPercent =
                  ((section.predictedLevel - section.baseLevel) /
                    (section.dangerLevel - section.baseLevel)) *
                  100;

                return (
                  <div
                    key={section.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">
                        {section.name}断面
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${sectionRisk.bg} ${sectionRisk.color}`}
                      >
                        {sectionRisk.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold font-mono text-gray-800">
                        {section.predictedLevel}
                      </span>
                      <span className="text-sm text-gray-500">m</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            section.riskLevel === "high"
                              ? "bg-red-500"
                              : section.riskLevel === "medium"
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(levelPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>基础: {section.baseLevel}m</span>
                        <span>警戒: {section.warningLevel}m</span>
                        <span>危险: {section.dangerLevel}m</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="data-card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                风险点分布地图
              </h3>
              <BasinMap
                reservoirs={reservoirs}
                riskPoints={riskPoints}
                height={320}
                onReservoirClick={(res) => setHighlightedReservoirId(res.id)}
              />
            </div>

            <div className="data-card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                风险点列表
              </h3>
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {riskPoints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>暂无风险点</p>
                  </div>
                ) : (
                  riskPoints.map((point) => {
                    const pointRisk = getRiskLevelInfo(point.level);
                    return (
                      <div
                        key={point.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-gray-800">
                            {point.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${pointRisk.bg} ${pointRisk.color}`}
                          >
                            {pointRisk.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {point.description}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
