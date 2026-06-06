import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranch,
  Play,
  AlertTriangle,
  MapPin,
  Droplets,
  Clock,
  ChevronDown,
  Plus,
  Eye,
  FileText,
  History,
  RotateCcw,
  GitCompare,
  Check,
  X,
  Save,
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
  Command,
  SchemeVersion,
  ReservoirOperation,
} from "../types";
import { formatNumber, formatTime } from "../utils/format";
import { useAppStore } from "../store/useAppStore";

const calculateDurationHours = (startTime: string, endTime: string): number => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
};

const calculateOverlapHours = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): number => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  const overlapStart = Math.max(s1, s2);
  const overlapEnd = Math.min(e1, e2);
  return Math.max(0, (overlapEnd - overlapStart) / (1000 * 60 * 60));
};

const calculateSectionResults = (
  operations: ReservoirSimulationState[],
  STORAGE_COEFFICIENT: number,
  DURATION_COEFFICIENT: number,
  DISCHARGE_COEFFICIENT_BASE: number,
  OVERLAY_COEFFICIENT: number
) => {
  return downstreamSections.map((section) => {
    let predictedLevel = section.baseLevel;
    let sectionAccumulation = 0;

    operations.forEach((state) => {
      const reservoir = reservoirs.find((r) => r.id === state.reservoirId);
      if (!reservoir) return;

      const coefficient = section.influenceCoefficients[state.reservoirId] || 0;
      const dischargeInfluence = state.discharge * coefficient * DISCHARGE_COEFFICIENT_BASE;
      predictedLevel += dischargeInfluence;

      const targetLevelDiff = state.targetLevel - reservoir.floodLimitLevel;
      const targetInfluence = targetLevelDiff * STORAGE_COEFFICIENT * coefficient * 10;
      predictedLevel += targetInfluence;

      const durationHours = calculateDurationHours(state.startTime, state.endTime);
      const durationInfluence = durationHours * DURATION_COEFFICIENT * coefficient * 5;
      predictedLevel += durationInfluence;
      sectionAccumulation += durationHours * 0.3;
    });

    for (let i = 0; i < operations.length; i++) {
      for (let j = i + 1; j < operations.length; j++) {
        const overlap = calculateOverlapHours(
          operations[i].startTime,
          operations[i].endTime,
          operations[j].startTime,
          operations[j].endTime
        );
        const coeff1 = section.influenceCoefficients[operations[i].reservoirId] || 0;
        const coeff2 = section.influenceCoefficients[operations[j].reservoirId] || 0;
        const avgCoeff = (coeff1 + coeff2) / 2;
        predictedLevel += overlap * OVERLAY_COEFFICIENT * avgCoeff * 2;
        sectionAccumulation += overlap * 0.2;
      }
    }

    let baseRiskLevel: "low" | "medium" | "high" = "low";
    if (predictedLevel >= section.dangerLevel) {
      baseRiskLevel = "high";
    } else if (predictedLevel >= section.warningLevel) {
      baseRiskLevel = "medium";
    }

    let finalRiskLevel = baseRiskLevel;
    if (sectionAccumulation >= 30 && baseRiskLevel === "medium") {
      finalRiskLevel = "high";
    } else if (sectionAccumulation >= 15 && baseRiskLevel === "low") {
      finalRiskLevel = "medium";
    }

    return {
      ...section,
      predictedLevel: Math.round(predictedLevel * 10) / 10,
      riskLevel: finalRiskLevel,
      baseRiskLevel,
      sectionAccumulation: Math.round(sectionAccumulation * 10) / 10,
    };
  });
};

const calculateRiskPoints = (sectionResults: ReturnType<typeof calculateSectionResults>) => {
  const points: RiskPoint[] = [];
  sectionResults.forEach((section) => {
    if (section.riskLevel === "low" && section.sectionAccumulation < 10) return;

    let basePointCount = 0;
    if (section.riskLevel === "high") {
      basePointCount = 3;
    } else if (section.riskLevel === "medium") {
      basePointCount = 2;
    } else {
      basePointCount = 1;
    }

    let bonusPoints = 0;
    if (section.sectionAccumulation >= 40) {
      bonusPoints = 2;
    } else if (section.sectionAccumulation >= 20) {
      bonusPoints = 1;
    }

    const totalPoints = Math.min(basePointCount + bonusPoints, 5);
    const isHighAccumulation = section.sectionAccumulation >= 20;

    for (let i = 0; i < totalPoints; i++) {
      const angle = (i / totalPoints) * Math.PI * 2;
      const distance = 0.15 + i * 0.05;

      let pointLevel: "high" | "medium" | "low" = section.riskLevel;
      if (isHighAccumulation && i < bonusPoints && section.riskLevel !== "high") {
        pointLevel = section.riskLevel === "medium" ? "high" : "medium";
      }

      let description = `${section.name}断面水位${section.predictedLevel}m`;
      if (section.sectionAccumulation >= 20) {
        description += `，执行时段累积风险较高`;
      }
      if (section.riskLevel === "high") {
        description += "，超危险水位";
      } else if (section.riskLevel === "medium") {
        description += "，接近警戒水位";
      } else {
        description += "，存在累积风险";
      }

      points.push({
        id: `rp-${section.id}-${i}`,
        name: `${section.name}风险点${i + 1}`,
        lat: section.lat + Math.sin(angle) * distance,
        lng: section.lng + Math.cos(angle) * distance,
        level: pointLevel,
        description,
      });
    }
  });
  return points;
};

export default function Scheme() {
  const navigate = useNavigate();
  const { getCommandsBySchemeId, getVersionsBySchemeId, createVersion, rollbackToVersion, currentUser } = useAppStore();
  
  const [selectedScheme, setSelectedScheme] = useState(schemes[0]);
  const [showSchemeDropdown, setShowSchemeDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
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
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [showSaveVersionModal, setShowSaveVersionModal] = useState(false);
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [currentVersionId, setCurrentVersionId] = useState<string>("version-003");

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

  const STORAGE_COEFFICIENT = 0.15;
  const DURATION_COEFFICIENT = 0.02;
  const DISCHARGE_COEFFICIENT_BASE = 1;
  const OVERLAY_COEFFICIENT = 0.3;

  const reservoirImpactValues = useMemo(() => {
    return simulationStates.map((state) => {
      const reservoir = reservoirs.find((r) => r.id === state.reservoirId);
      if (!reservoir) return { reservoirId: state.reservoirId, impactValue: 0 };

      const targetLevelDiff = state.targetLevel - reservoir.floodLimitLevel;
      const durationHours = calculateDurationHours(state.startTime, state.endTime);

      const targetImpact = targetLevelDiff * STORAGE_COEFFICIENT;
      const durationImpact = durationHours * DURATION_COEFFICIENT;
      const dischargeImpact = state.discharge * 0.001;

      const impactValue = targetImpact + durationImpact + dischargeImpact;

      return {
        reservoirId: state.reservoirId,
        impactValue: Math.round(impactValue * 100) / 100,
      };
    });
  }, [simulationStates]);

  const relatedCommands = useMemo(() => {
    if (!selectedScheme) return [];
    return getCommandsBySchemeId(selectedScheme.id);
  }, [selectedScheme, getCommandsBySchemeId]);

  const riskAccumulation = useMemo(() => {
    let totalAccumulation = 0;
    const reservoirDurations: Record<string, number> = {};

    simulationStates.forEach((state) => {
      const durationHours = calculateDurationHours(state.startTime, state.endTime);
      reservoirDurations[state.reservoirId] = durationHours;
      totalAccumulation += durationHours * 0.5;
    });

    for (let i = 0; i < simulationStates.length; i++) {
      for (let j = i + 1; j < simulationStates.length; j++) {
        const overlap = calculateOverlapHours(
          simulationStates[i].startTime,
          simulationStates[i].endTime,
          simulationStates[j].startTime,
          simulationStates[j].endTime
        );
        totalAccumulation += overlap * OVERLAY_COEFFICIENT;
      }
    }

    let accumulationLevel: "low" | "medium" | "high" = "low";
    if (totalAccumulation >= 50) {
      accumulationLevel = "high";
    } else if (totalAccumulation >= 25) {
      accumulationLevel = "medium";
    }

    return {
      totalAccumulation: Math.round(totalAccumulation * 10) / 10,
      accumulationLevel,
      reservoirDurations,
    };
  }, [simulationStates]);

  const sectionResults = useMemo(() => {
    return calculateSectionResults(
      simulationStates,
      STORAGE_COEFFICIENT,
      DURATION_COEFFICIENT,
      DISCHARGE_COEFFICIENT_BASE,
      OVERLAY_COEFFICIENT
    );
  }, [simulationStates]);

  const overallRiskLevel = useMemo(() => {
    const levels = sectionResults.map((s) => s.riskLevel);
    if (levels.includes("high") || riskAccumulation.accumulationLevel === "high") {
      return "high";
    }
    if (levels.includes("medium") || riskAccumulation.accumulationLevel === "medium") {
      return "medium";
    }
    return "low";
  }, [sectionResults, riskAccumulation]);

  const riskPoints = useMemo(() => {
    return calculateRiskPoints(sectionResults);
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

  const versions = useMemo(() => {
    return getVersionsBySchemeId(selectedScheme.id);
  }, [selectedScheme.id, getVersionsBySchemeId]);

  const currentVersion = useMemo(() => {
    return versions.find(v => v.id === currentVersionId);
  }, [versions, currentVersionId]);

  const handleVersionSelect = (versionId: string) => {
    const operations = rollbackToVersion(selectedScheme.id, versionId);
    if (operations) {
      const newStates = operations.map(op => ({
        reservoirId: op.reservoirId,
        targetLevel: op.targetLevel,
        discharge: op.discharge,
        startTime: op.startTime,
        endTime: op.endTime,
      }));
      setSimulationStates(newStates);
      setCurrentVersionId(versionId);
    }
    setShowVersionDropdown(false);
  };

  const handleToggleVersionCompare = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      }
      return prev;
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setShowComparePanel(true);
      setShowVersionDropdown(false);
    }
  };

  const handleRollback = (versionId: string) => {
    handleVersionSelect(versionId);
  };

  const handleSaveVersion = () => {
    if (!newVersionDescription.trim()) return;
    const operations: ReservoirOperation[] = simulationStates.map(state => {
      const reservoir = reservoirs.find(r => r.id === state.reservoirId);
      return {
        reservoirId: state.reservoirId,
        reservoirName: reservoir?.name || "",
        targetLevel: state.targetLevel,
        discharge: state.discharge,
        startTime: state.startTime,
        endTime: state.endTime,
      };
    });
    createVersion(selectedScheme.id, operations, newVersionDescription, currentUser.name);
    setNewVersionDescription("");
    setShowSaveVersionModal(false);
  };

  const compareData = useMemo(() => {
    if (selectedVersions.length !== 2) return null;
    const v1 = versions.find(v => v.id === selectedVersions[0]);
    const v2 = versions.find(v => v.id === selectedVersions[1]);
    if (!v1 || !v2) return null;

    const diffs = reservoirs.map(res => {
      const op1 = v1.reservoirOperations.find(o => o.reservoirId === res.id);
      const op2 = v2.reservoirOperations.find(o => o.reservoirId === res.id);
      return {
        reservoirId: res.id,
        reservoirName: res.name,
        targetLevelDiff: (op2?.targetLevel || 0) - (op1?.targetLevel || 0),
        dischargeDiff: (op2?.discharge || 0) - (op1?.discharge || 0),
        v1TargetLevel: op1?.targetLevel || 0,
        v2TargetLevel: op2?.targetLevel || 0,
        v1Discharge: op1?.discharge || 0,
        v2Discharge: op2?.discharge || 0,
      };
    });

    const v1States: ReservoirSimulationState[] = v1.reservoirOperations.map(op => ({
      reservoirId: op.reservoirId,
      targetLevel: op.targetLevel,
      discharge: op.discharge,
      startTime: op.startTime,
      endTime: op.endTime,
    }));
    const v2States: ReservoirSimulationState[] = v2.reservoirOperations.map(op => ({
      reservoirId: op.reservoirId,
      targetLevel: op.targetLevel,
      discharge: op.discharge,
      startTime: op.startTime,
      endTime: op.endTime,
    }));

    const v1SectionResults = calculateSectionResults(
      v1States,
      STORAGE_COEFFICIENT,
      DURATION_COEFFICIENT,
      DISCHARGE_COEFFICIENT_BASE,
      OVERLAY_COEFFICIENT
    );
    const v2SectionResults = calculateSectionResults(
      v2States,
      STORAGE_COEFFICIENT,
      DURATION_COEFFICIENT,
      DISCHARGE_COEFFICIENT_BASE,
      OVERLAY_COEFFICIENT
    );

    const sectionDiffs = downstreamSections.map(section => {
      const s1 = v1SectionResults.find(s => s.id === section.id);
      const s2 = v2SectionResults.find(s => s.id === section.id);
      const levelDiff = (s2?.predictedLevel || 0) - (s1?.predictedLevel || 0);
      return {
        sectionId: section.id,
        sectionName: section.name,
        v1PredictedLevel: s1?.predictedLevel || 0,
        v2PredictedLevel: s2?.predictedLevel || 0,
        levelDiff,
        v1RiskLevel: s1?.riskLevel || "low",
        v2RiskLevel: s2?.riskLevel || "low",
      };
    });

    const v1RiskPoints = calculateRiskPoints(v1SectionResults);
    const v2RiskPoints = calculateRiskPoints(v2SectionResults);

    const v1RiskPointIds = new Set(v1RiskPoints.map(p => p.id));
    const v2RiskPointIds = new Set(v2RiskPoints.map(p => p.id));

    const v1OnlyRiskPoints = v1RiskPoints.filter(p => !v2RiskPointIds.has(p.id));
    const v2OnlyRiskPoints = v2RiskPoints.filter(p => !v1RiskPointIds.has(p.id));
    const commonRiskPoints = v1RiskPoints.filter(p => v2RiskPointIds.has(p.id));

    return { 
      v1, 
      v2, 
      diffs, 
      sectionDiffs, 
      v1SectionResults, 
      v2SectionResults,
      v1RiskPoints,
      v2RiskPoints,
      v1OnlyRiskPoints,
      v2OnlyRiskPoints,
      commonRiskPoints,
    };
  }, [selectedVersions, versions]);

  const handleGenerateCommand = () => {
    if (!selectedScheme) return;
    navigate(`/command?schemeId=${selectedScheme.id}`);
  };

  const handleViewCommandDetail = (commandId: string) => {
    navigate(`/command?commandId=${commandId}`);
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

          <div className="relative">
            <button
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
              className="btn-secondary flex items-center gap-2 min-w-[220px] justify-between"
            >
              <History className="w-4 h-4 text-primary-500" />
              <span className="truncate">
                {currentVersion ? currentVersion.name : "选择版本"}
              </span>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </button>
            {showVersionDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30 min-w-[360px] max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">版本列表</span>
                    <span className="text-xs text-gray-500">勾选2个版本可对比</span>
                  </div>
                </div>
                {versions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">暂无版本记录</p>
                  </div>
                ) : (
                  <>
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                          currentVersionId === version.id ? "bg-primary-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={selectedVersions.includes(version.id)}
                              onChange={() => handleToggleVersionCompare(version.id)}
                              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">
                                {version.name}
                              </span>
                              {currentVersionId === version.id && (
                                <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                                  当前
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              创建人: {version.creator} · {formatTime(version.createTime)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 truncate">
                              {version.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRollback(version.id);
                              }}
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              title="回滚到此版本"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={handleCompare}
                        disabled={selectedVersions.length !== 2}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedVersions.length === 2
                            ? "bg-primary-600 text-white hover:bg-primary-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <GitCompare className="w-4 h-4" />
                        对比选中版本 ({selectedVersions.length}/2)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {currentVersion && (
            <div className="text-sm text-gray-500">
              <span className="text-gray-400">当前版本创建于 </span>
              <span className="text-gray-700">{formatTime(currentVersion.createTime)}</span>
            </div>
          )}

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-primary-500" />
                水库参数调整
              </h3>
              <button
                onClick={() => setShowSaveVersionModal(true)}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <Save className="w-4 h-4" />
                保存为新版本
              </button>
            </div>
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
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        预计影响: {reservoirImpactValues.find(v => v.reservoirId === reservoir.id)?.impactValue || 0}
                      </span>
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

      <div className="data-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            本方案生成的调度指令
          </h3>
          {relatedCommands.length > 0 && (
            <button
              onClick={handleGenerateCommand}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              生成新指令
            </button>
          )}
        </div>

        {relatedCommands.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    指令ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    标题
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    创建时间
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    执行人
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {relatedCommands.map((cmd) => (
                  <tr key={cmd.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                      {cmd.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                      {cmd.title}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cmd.status} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatTime(cmd.createTime)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {cmd.executor}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewCommandDetail(cmd.id)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">暂无调度指令</p>
            <button
              onClick={handleGenerateCommand}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              生成指令
            </button>
          </div>
        )}
      </div>

      {showComparePanel && compareData && (
        <div className="data-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary-500" />
              版本对比
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRollback(compareData.v1.id)}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                回滚到版本A
              </button>
              <button
                onClick={() => handleRollback(compareData.v2.id)}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                回滚到版本B
              </button>
              <button
                onClick={() => {
                  setShowComparePanel(false);
                  setSelectedVersions([]);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-5 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">版本 A</p>
              <p className="text-sm font-medium text-blue-800">{compareData.v1.name}</p>
              <p className="text-xs text-blue-600 mt-1">
                {compareData.v1.creator} · {formatTime(compareData.v1.createTime)}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-center">
              <GitCompare className="w-6 h-6 text-gray-400" />
            </div>
            <div className="col-span-5 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium mb-1">版本 B</p>
              <p className="text-sm font-medium text-green-800">{compareData.v2.name}</p>
              <p className="text-xs text-green-600 mt-1">
                {compareData.v2.creator} · {formatTime(compareData.v2.createTime)}
              </p>
            </div>
          </div>

          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary-500" />
            水库参数对比
          </h4>
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    水库名称
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本A目标水位
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本B目标水位
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    水位差异
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本A泄流量
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本B泄流量
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    泄流量差异
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareData.diffs.map((diff) => (
                  <tr key={diff.reservoirId} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {diff.reservoirName}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-blue-600">
                      {diff.v1TargetLevel} m
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-green-600">
                      {diff.v2TargetLevel} m
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      <span className={diff.targetLevelDiff > 0 ? "text-red-600" : diff.targetLevelDiff < 0 ? "text-green-600" : "text-gray-500"}>
                        {diff.targetLevelDiff > 0 ? "+" : ""}{diff.targetLevelDiff.toFixed(1)} m
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-blue-600">
                      {diff.v1Discharge} m³/s
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-green-600">
                      {diff.v2Discharge} m³/s
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono">
                      <span className={diff.dischargeDiff > 0 ? "text-red-600" : diff.dischargeDiff < 0 ? "text-green-600" : "text-gray-500"}>
                        {diff.dischargeDiff > 0 ? "+" : ""}{diff.dischargeDiff} m³/s
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            下游关键断面水位差异
          </h4>
          <div className="overflow-x-auto mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    断面名称
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本A预计水位
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本B预计水位
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    水位差异
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本A风险等级
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    版本B风险等级
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    风险变化
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareData.sectionDiffs.map((diff) => {
                  const riskOrder = { low: 0, medium: 1, high: 2 };
                  const riskChange = riskOrder[diff.v2RiskLevel] - riskOrder[diff.v1RiskLevel];
                  const v1Risk = getRiskLevelInfo(diff.v1RiskLevel);
                  const v2Risk = getRiskLevelInfo(diff.v2RiskLevel);
                  return (
                    <tr key={diff.sectionId} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">
                        {diff.sectionName}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono text-blue-600">
                        {diff.v1PredictedLevel} m
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono text-green-600">
                        {diff.v2PredictedLevel} m
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-mono">
                        <span className={diff.levelDiff > 0 ? "text-red-600" : diff.levelDiff < 0 ? "text-green-600" : "text-gray-500"}>
                          {diff.levelDiff > 0 ? "+" : ""}{diff.levelDiff.toFixed(1)} m
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v1Risk.bg} ${v1Risk.color}`}>
                          {v1Risk.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v2Risk.bg} ${v2Risk.color}`}>
                          {v2Risk.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {riskChange > 0 ? (
                          <span className="text-red-600 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            升级
                          </span>
                        ) : riskChange < 0 ? (
                          <span className="text-green-600 flex items-center justify-center gap-1">
                            <Check className="w-4 h-4" />
                            降级
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center justify-center gap-1">
                            <X className="w-4 h-4" />
                            不变
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            风险点变化对比
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-red-800">版本A独有风险点</h5>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  {compareData.v1OnlyRiskPoints.length} 个
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {compareData.v1OnlyRiskPoints.length === 0 ? (
                  <p className="text-xs text-red-400 text-center py-4">无独有风险点</p>
                ) : (
                  compareData.v1OnlyRiskPoints.map((point) => {
                    const riskInfo = getRiskLevelInfo(point.level);
                    return (
                      <div key={point.id} className="p-2 bg-white rounded border border-red-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800">{point.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${riskInfo.bg} ${riskInfo.color}`}>
                            {riskInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{point.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-green-800">版本B独有风险点</h5>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {compareData.v2OnlyRiskPoints.length} 个
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {compareData.v2OnlyRiskPoints.length === 0 ? (
                  <p className="text-xs text-green-400 text-center py-4">无独有风险点</p>
                ) : (
                  compareData.v2OnlyRiskPoints.map((point) => {
                    const riskInfo = getRiskLevelInfo(point.level);
                    return (
                      <div key={point.id} className="p-2 bg-white rounded border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800">{point.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${riskInfo.bg} ${riskInfo.color}`}>
                            {riskInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{point.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-800">两版本共有风险点</h5>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
                  {compareData.commonRiskPoints.length} 个
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {compareData.commonRiskPoints.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">无共有风险点</p>
                ) : (
                  compareData.commonRiskPoints.map((point) => {
                    const riskInfo = getRiskLevelInfo(point.level);
                    return (
                      <div key={point.id} className="p-2 bg-white rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800">{point.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${riskInfo.bg} ${riskInfo.color}`}>
                            {riskInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{point.description}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaveVersionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">保存为新版本</h3>
              <button
                onClick={() => {
                  setShowSaveVersionModal(false);
                  setNewVersionDescription("");
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                版本说明
              </label>
              <textarea
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="请输入本次版本的修改说明..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSaveVersionModal(false);
                  setNewVersionDescription("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={!newVersionDescription.trim()}
                className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
                  newVersionDescription.trim()
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Save className="w-4 h-4" />
                保存版本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
