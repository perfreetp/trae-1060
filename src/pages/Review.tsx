import { useState } from "react";
import {
  FileBarChart,
  Search,
  Star,
  ListTodo,
  Users,
  Clock,
  Download,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import RadarChart from "../components/Charts/RadarChart";
import StatusBadge from "../components/Common/StatusBadge";
import {
  historicalFloods,
  reviewScores,
  issues,
  shiftHandovers,
} from "../data/review";
import { formatDate, formatTime, getLevelColor, getStatusColor } from "../utils/format";

export default function Review() {
  const [activeTab, setActiveTab] = useState<"history" | "score" | "issues" | "shift">("history");
  const [selectedFlood, setSelectedFlood] = useState(historicalFloods[0]);

  const score = reviewScores.find((s) => s.floodId === selectedFlood.id);
  const indicators = [
    { name: "预报准确率", max: 100 },
    { name: "方案合理性", max: 100 },
    { name: "执行及时性", max: 100 },
    { name: "减灾效益", max: 100 },
    { name: "协同配合", max: 100 },
  ];
  const values = score
    ? [
        score.dimensions.forecastAccuracy,
        score.dimensions.schemeRationality,
        score.dimensions.executionTimeliness,
        score.dimensions.disasterReduction,
        score.dimensions.collaboration,
      ]
    : [0, 0, 0, 0, 0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-primary-500" />
          复盘评估
        </h2>
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出报告
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "history", label: "历史洪水检索", icon: Search },
          { key: "score", label: "复盘评分", icon: Star },
          { key: "issues", label: "问题清单", icon: ListTodo },
          { key: "shift", label: "值班交接", icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "history" && (
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 space-y-3">
            <h3 className="text-sm font-medium text-gray-600 mb-2">历史洪水记录</h3>
            {historicalFloods.map((flood) => (
              <div
                key={flood.id}
                onClick={() => setSelectedFlood(flood)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedFlood.id === flood.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <h4 className="font-medium text-gray-800 text-sm">{flood.name}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(flood.startTime)} - {formatDate(flood.endTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-3 space-y-6">
            <div className="data-card">
              <h3 className="font-semibold text-gray-800 mb-4">
                {selectedFlood.name} - 基本信息
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">开始时间</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedFlood.startTime)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">结束时间</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedFlood.endTime)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最大降雨量</p>
                  <p className="font-medium text-gray-800">
                    {selectedFlood.maxRainfall}mm
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最高水位</p>
                  <p className="font-medium text-gray-800">
                    {selectedFlood.maxLevel}m
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">影响水库</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFlood.affectedReservoirs.map((r, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "score" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4">调度效果评分</h3>
            <RadarChart
              indicators={indicators}
              values={values}
              title={selectedFlood.name}
              height={350}
            />
          </div>
          <div className="data-card">
            <h3 className="font-semibold text-gray-800 mb-4">评分详情</h3>
            {score && (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">综合评分</p>
                  <p className="text-5xl font-bold text-primary-600">
                    {score.totalScore}
                    <span className="text-lg text-gray-400 ml-1">/ 100</span>
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "预报准确率", value: score.dimensions.forecastAccuracy },
                    { label: "方案合理性", value: score.dimensions.schemeRationality },
                    { label: "执行及时性", value: score.dimensions.executionTimeliness },
                    { label: "减灾效益", value: score.dimensions.disasterReduction },
                    { label: "协同配合", value: score.dimensions.collaboration },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium text-gray-800">{item.value}分</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <p>评分人: {score.reviewer}</p>
                  <p>评分时间: {formatTime(score.reviewTime)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "issues" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button className="btn-secondary text-sm py-1.5">全部</button>
              <button className="btn-secondary text-sm py-1.5">待处理</button>
              <button className="btn-secondary text-sm py-1.5">处理中</button>
              <button className="btn-secondary text-sm py-1.5">已关闭</button>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm py-1.5">
              <Plus className="w-4 h-4" />
              新增问题
            </button>
          </div>
          <div className="data-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">问题标题</th>
                    <th className="table-header">严重程度</th>
                    <th className="table-header">状态</th>
                    <th className="table-header">责任人</th>
                    <th className="table-header">创建时间</th>
                    <th className="table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-800">{issue.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{issue.description}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            issue.level === "critical"
                              ? "bg-red-100 text-red-800"
                              : issue.level === "major"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {issue.level === "critical"
                            ? "严重"
                            : issue.level === "major"
                            ? "重要"
                            : "一般"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="table-cell">{issue.assignee}</td>
                      <td className="table-cell text-gray-500">
                        {formatTime(issue.createTime)}
                      </td>
                      <td className="table-cell">
                        <button className="text-primary-600 hover:text-primary-700 text-sm">
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "shift" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-600">交接班记录</h3>
            <button className="btn-primary flex items-center gap-2 text-sm py-1.5">
              <Plus className="w-4 h-4" />
              新建交接
            </button>
          </div>
          <div className="space-y-4">
            {shiftHandovers.map((shift) => (
              <div key={shift.id} className="data-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        shift.shiftType === "day"
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {shift.shiftType === "day" ? "白班" : "夜班"}交接
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatTime(shift.handoverTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      交班人: <span className="text-gray-800">{shift.outgoingPerson}</span>
                    </span>
                    <span className="text-gray-500">
                      接班人: <span className="text-gray-800">{shift.incomingPerson}</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">重点事项</p>
                    <p className="text-sm text-gray-700">{shift.keyPoints}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">待办事项</p>
                    <p className="text-sm text-gray-700">{shift.pendingTasks}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">备注</p>
                    <p className="text-sm text-gray-700">{shift.remarks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
