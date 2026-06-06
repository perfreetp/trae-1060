import { useState } from "react";
import {
  GitBranch,
  Plus,
  Play,
  CheckCircle,
  FileText,
  MapPin,
  Download,
  Eye,
} from "lucide-react";
import LineChart from "../components/Charts/LineChart";
import BasinMap from "../components/Map/BasinMap";
import StatusBadge from "../components/Common/StatusBadge";
import { schemes } from "../data/command";
import { reservoirs } from "../data/reservoir";
import { formatNumber, formatTime } from "../utils/format";

export default function Scheme() {
  const [selectedScheme, setSelectedScheme] = useState(schemes[0]);
  const [simulateDischarge, setSimulateDischarge] = useState(800);

  const simulatedLevels = Array.from({ length: 24 }, (_, i) => {
    const base = 198.5;
    const effect = (simulateDischarge / 1000) * 0.8;
    return base + Math.sin(i / 4) * 0.5 - effect * (i / 24);
  });
  const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-primary-500" />
          联合调度方案
        </h2>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出方案
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建方案
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">方案列表</h3>
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              onClick={() => setSelectedScheme(scheme)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedScheme.id === scheme.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800 text-sm">
                  {scheme.name}
                </h4>
                <StatusBadge status={scheme.status} />
              </div>
              <p className="text-xs text-gray-500">
                创建人: {scheme.creator}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatTime(scheme.createTime)}
              </p>
            </div>
          ))}
        </div>

        <div className="col-span-3 space-y-6">
          <div className="data-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {selectedScheme.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  创建人: {selectedScheme.creator} · {formatTime(selectedScheme.createTime)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex items-center gap-2 text-sm py-1.5">
                  <Eye className="w-4 h-4" />
                  预览
                </button>
                {selectedScheme.status === "draft" && (
                  <button className="btn-primary flex items-center gap-2 text-sm py-1.5">
                    <CheckCircle className="w-4 h-4" />
                    提交审批
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">预计最高水位</p>
                <p className="text-xl font-bold font-mono text-primary-600">
                  {selectedScheme.simulationResult.maxLevel}m
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">总下泄流量</p>
                <p className="text-xl font-bold font-mono text-orange-600">
                  {selectedScheme.simulationResult.totalDischarge}m³/s
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">风险等级</p>
                <p className="text-xl font-bold text-yellow-600">
                  {selectedScheme.simulationResult.riskLevel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="data-card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-primary-500" />
                方案模拟
              </h3>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  调整泄流量: <span className="font-bold text-primary-600">{simulateDischarge} m³/s</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  value={simulateDischarge}
                  onChange={(e) => setSimulateDischarge(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>
              <LineChart
                data={[
                  {
                    name: "模拟水位",
                    values: simulatedLevels,
                    color: "#3E92CC",
                  },
                ]}
                xAxisData={hours}
                title="24小时水位模拟"
                yAxisName="m"
                height={200}
                showLegend={false}
              />
            </div>

            <div className="data-card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                风险点分布
              </h3>
              <BasinMap
                reservoirs={reservoirs}
                riskPoints={selectedScheme.riskPoints}
                height={280}
              />
            </div>
          </div>

          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              水库调度操作
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">水库名称</th>
                    <th className="table-header">目标水位 (m)</th>
                    <th className="table-header">泄流量 (m³/s)</th>
                    <th className="table-header">开始时间</th>
                    <th className="table-header">结束时间</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedScheme.reservoirOperations.map((op, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{op.reservoirName}</td>
                      <td className="table-cell font-mono">{op.targetLevel}</td>
                      <td className="table-cell font-mono">{op.discharge}</td>
                      <td className="table-cell">{formatTime(op.startTime)}</td>
                      <td className="table-cell">{formatTime(op.endTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
