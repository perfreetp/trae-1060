import { useState, useRef, useMemo } from "react";
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
  X,
  User,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Flag,
} from "lucide-react";
import RadarChart from "../components/Charts/RadarChart";
import DualAxisChart from "../components/Charts/DualAxisChart";
import StatusBadge from "../components/Common/StatusBadge";
import {
  historicalFloods,
  reviewScores,
} from "../data/review";
import { formatDate, formatTime } from "../utils/format";
import { useAppStore } from "../store/useAppStore";
import { exportChartAsImage, exportTableAsCSV } from "../utils/export";
import type { ChartRef } from "../components/Charts/LineChart";
import type { IssueFormData, ShiftHandoverFormData, Issue } from "../types";

export default function Review() {
  const {
    issues,
    shiftHandovers,
    currentUser,
    receivers,
    addIssue,
    updateIssueStatus,
    assignIssue,
    addShiftHandover,
    confirmShiftHandover,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"history" | "score" | "issues" | "shift">("history");
  const [selectedFlood, setSelectedFlood] = useState(historicalFloods[0]);
  const [selectedScoreFloodId, setSelectedScoreFloodId] = useState(historicalFloods[0].id);

  const radarChartRef = useRef<ChartRef>(null);
  const dualAxisChartRef = useRef<ChartRef>(null);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueFilter, setIssueFilter] = useState<"all" | "open" | "processing" | "closed">("all");

  const [issueForm, setIssueForm] = useState<IssueFormData>({
    title: "",
    description: "",
    level: "minor",
    assignee: "",
  });

  const [shiftForm, setShiftForm] = useState<ShiftHandoverFormData>({
    shiftType: "day",
    incomingPerson: "",
    waterSummary: "",
    pendingCommands: "",
    riskPoints: "",
    notes: "",
  });

  const [assignPerson, setAssignPerson] = useState("");
  const [resolution, setResolution] = useState("");

  const score = useMemo(
    () => reviewScores.find((s) => s.floodId === selectedFlood.id),
    [selectedFlood.id]
  );

  const scoreForTab = useMemo(
    () => reviewScores.find((s) => s.floodId === selectedScoreFloodId),
    [selectedScoreFloodId]
  );

  const indicators = [
    { name: "预报准确率", max: 100 },
    { name: "方案合理性", max: 100 },
    { name: "执行及时性", max: 100 },
    { name: "减灾效果", max: 100 },
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

  const valuesForTab = scoreForTab
    ? [
        scoreForTab.dimensions.forecastAccuracy,
        scoreForTab.dimensions.schemeRationality,
        scoreForTab.dimensions.executionTimeliness,
        scoreForTab.dimensions.disasterReduction,
        scoreForTab.dimensions.collaboration,
      ]
    : [0, 0, 0, 0, 0];

  const relatedIssues = useMemo(
    () => issues.filter((issue) => selectedFlood.relatedIssueIds.includes(issue.id)),
    [issues, selectedFlood.relatedIssueIds]
  );

  const filteredIssues = useMemo(() => {
    if (issueFilter === "all") return issues;
    return issues.filter((issue) => issue.status === issueFilter);
  }, [issues, issueFilter]);

  const handleAddIssue = () => {
    if (!issueForm.title || !issueForm.description || !issueForm.assignee) {
      alert("请填写完整信息");
      return;
    }
    addIssue(issueForm, currentUser.name);
    setShowIssueModal(false);
    setIssueForm({ title: "", description: "", level: "minor", assignee: "" });
  };

  const handleAssignIssue = () => {
    if (!selectedIssue || !assignPerson) {
      alert("请选择责任人");
      return;
    }
    assignIssue(selectedIssue.id, assignPerson);
    setShowAssignModal(false);
    setSelectedIssue(null);
    setAssignPerson("");
  };

  const handleMarkProcessing = (issue: Issue) => {
    updateIssueStatus(issue.id, "processing");
  };

  const handleCloseIssue = () => {
    if (!selectedIssue || !resolution) {
      alert("请填写整改说明");
      return;
    }
    updateIssueStatus(selectedIssue.id, "closed", resolution);
    setShowCloseModal(false);
    setSelectedIssue(null);
    setResolution("");
  };

  const handleAddShift = () => {
    if (!shiftForm.incomingPerson || !shiftForm.waterSummary) {
      alert("请填写必填信息");
      return;
    }
    addShiftHandover(shiftForm, currentUser.name);
    setShowShiftModal(false);
    setShiftForm({
      shiftType: "day",
      incomingPerson: "",
      waterSummary: "",
      pendingCommands: "",
      riskPoints: "",
      notes: "",
    });
  };

  const handleExportRadar = () => {
    const flood = historicalFloods.find((f) => f.id === selectedScoreFloodId);
    exportChartAsImage(
      radarChartRef.current,
      "复盘评估",
      flood?.name || "复盘评分",
      "评分雷达图"
    );
  };

  const handleExportRainfallWaterChart = () => {
    const timeRange = `${formatDate(selectedFlood.startTime)}-${formatDate(selectedFlood.endTime)}`;
    exportChartAsImage(
      dualAxisChartRef.current,
      selectedFlood.name,
      "雨情水情曲线",
      timeRange
    );
  };

  const handleExportDispatchCommandsCSV = () => {
    const headers = ["时间", "操作人", "动作", "详情"];
    const rows = selectedFlood.dispatchCommands.map((cmd) => [
      formatTime(cmd.time),
      cmd.operator,
      cmd.action,
      cmd.detail,
    ]);
    exportTableAsCSV(headers, rows, selectedFlood.name, "调度指令时间线", "");
  };

  const handleExportRelatedIssuesCSV = () => {
    const headers = ["问题标题", "严重程度", "状态", "责任人", "创建时间"];
    const rows = relatedIssues.map((issue) => [
      issue.title,
      issue.level === "critical" ? "严重" : issue.level === "major" ? "重要" : "一般",
      issue.status === "open" ? "待处理" : issue.status === "processing" ? "处理中" : "已关闭",
      issue.assignee,
      formatTime(issue.createTime),
    ]);
    exportTableAsCSV(headers, rows, selectedFlood.name, "问题清单", "");
  };

  const handleExportIssuesCSV = () => {
    const headers = ["问题标题", "严重程度", "状态", "责任人", "创建时间", "整改说明"];
    const rows = filteredIssues.map((issue) => [
      issue.title,
      issue.level === "critical" ? "严重" : issue.level === "major" ? "重要" : "一般",
      issue.status === "open" ? "待处理" : issue.status === "processing" ? "处理中" : "已关闭",
      issue.assignee,
      issue.createTime,
      issue.resolution || "",
    ]);
    exportTableAsCSV(headers, rows, "复盘评估", "问题清单", "全部");
  };

  const openAssignModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setAssignPerson(issue.assignee);
    setShowAssignModal(true);
  };

  const openCloseModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setResolution("");
    setShowCloseModal(true);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "major":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case "critical":
        return "严重";
      case "major":
        return "重要";
      default:
        return "一般";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-primary-500" />
          复盘评估
        </h2>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "history", label: "历史洪水", icon: Search },
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
            <h3 className="text-sm font-medium text-gray-600 mb-2">洪水事件列表</h3>
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
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="text-primary-600 font-medium">{flood.maxRainfall}mm</span>
                    <span className="text-gray-400">降雨</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="text-orange-600 font-medium">{flood.maxLevel}m</span>
                    <span className="text-gray-400">水位</span>
                  </div>
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

            <div className="data-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">雨情水情曲线</h3>
                <button
                  onClick={handleExportRainfallWaterChart}
                  className="btn-secondary text-xs py-1 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  导出图片
                </button>
              </div>
              <DualAxisChart
                ref={dualAxisChartRef}
                leftData={selectedFlood.levelData}
                rightData={selectedFlood.rainfallData}
                xAxisData={selectedFlood.timeLabels}
                leftName="水位(m)"
                rightName="降雨量(mm)"
                height={300}
              />
            </div>

            <div className="data-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">调度指令时间线</h3>
                <button
                  onClick={handleExportDispatchCommandsCSV}
                  className="btn-secondary text-xs py-1 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  导出CSV
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {selectedFlood.dispatchCommands.map((log, index) => (
                    <div key={log.id} className="relative pl-10">
                      <div
                        className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 border-white ${
                          index === 0 ? "bg-primary-500" : "bg-gray-300"
                        }`}
                      />
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-800 flex items-center gap-2">
                            {log.action.includes("下达") && <Flag className="w-4 h-4 text-primary-500" />}
                            {log.action.includes("执行") && <PlayCircle className="w-4 h-4 text-green-500" />}
                            {log.action.includes("启动") && <AlertCircle className="w-4 h-4 text-orange-500" />}
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(log.time)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{log.detail}</p>
                        <p className="text-xs text-gray-400 mt-1">操作人: {log.operator}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {score && (
                <div className="data-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">关联评分结果</h3>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-primary-600">
                      {score.totalScore}
                      <span className="text-lg text-gray-400 ml-1">/ 100</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">综合评分</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "预报准确率", value: score.dimensions.forecastAccuracy },
                      { label: "方案合理性", value: score.dimensions.schemeRationality },
                      { label: "执行及时性", value: score.dimensions.executionTimeliness },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium text-gray-800">{item.value}分</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="data-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">关联问题清单</h3>
                  <span className="text-xs text-gray-400">
                    {relatedIssues.length} 个问题
                  </span>
                </div>
                {relatedIssues.length > 0 ? (
                  <div className="space-y-2">
                    {relatedIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3 bg-gray-50 rounded-lg flex items-start gap-3"
                      >
                        <div
                          className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(
                            issue.level
                          )}`}
                        >
                          {getLevelText(issue.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {issue.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <StatusBadge status={issue.status} />
                            <span>{issue.assignee}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    暂无关联问题
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "score" && (
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">评分列表</h3>
              <button
                onClick={handleExportRadar}
                className="btn-secondary text-xs py-1 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                导出图片
              </button>
            </div>
            {historicalFloods.map((flood) => {
              const s = reviewScores.find((sc) => sc.floodId === flood.id);
              return (
                <div
                  key={flood.id}
                  onClick={() => setSelectedScoreFloodId(flood.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedScoreFloodId === flood.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <h4 className="font-medium text-gray-800 text-sm">{flood.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(flood.startTime)}</span>
                  </div>
                  {s ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-primary-600">
                        {s.totalScore}
                      </span>
                      <span className="text-xs text-gray-400">分</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {s.reviewer}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-400">暂无评分</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="col-span-3 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="data-card">
                <h3 className="font-semibold text-gray-800 mb-4">评分雷达图</h3>
                {scoreForTab ? (
                  <RadarChart
                    ref={radarChartRef}
                    indicators={indicators}
                    values={valuesForTab}
                    height={350}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-gray-400">
                    暂无评分数据
                  </div>
                )}
              </div>

              <div className="data-card">
                <h3 className="font-semibold text-gray-800 mb-4">评分详情</h3>
                {scoreForTab && (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-500 mb-2">综合评分</p>
                      <p className="text-5xl font-bold text-primary-600">
                        {scoreForTab.totalScore}
                        <span className="text-lg text-gray-400 ml-1">/ 100</span>
                      </p>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "预报准确率", value: scoreForTab.dimensions.forecastAccuracy },
                        { label: "方案合理性", value: scoreForTab.dimensions.schemeRationality },
                        { label: "执行及时性", value: scoreForTab.dimensions.executionTimeliness },
                        { label: "减灾效果", value: scoreForTab.dimensions.disasterReduction },
                        { label: "协同配合", value: scoreForTab.dimensions.collaboration },
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
                      <p>评分人: {scoreForTab.reviewer}</p>
                      <p>评分时间: {formatTime(scoreForTab.reviewTime)}</p>
                    </div>
                  </>
                )}
                {!scoreForTab && (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    该洪水暂无评分
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "issues" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {[
                { key: "all", label: "全部" },
                { key: "open", label: "待处理" },
                { key: "processing", label: "处理中" },
                { key: "closed", label: "已关闭" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setIssueFilter(filter.key as typeof issueFilter)}
                  className={`text-sm py-1.5 px-3 rounded ${
                    issueFilter === filter.key
                      ? "bg-primary-100 text-primary-700 font-medium"
                      : "btn-secondary"
                  }`}
                >
                  {filter.label}
                  <span className="ml-1 text-xs opacity-70">
                    ({filter.key === "all" ? issues.length : issues.filter((i) => i.status === filter.key).length})
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportIssuesCSV}
                className="btn-secondary flex items-center gap-2 text-sm py-1.5"
              >
                <Download className="w-4 h-4" />
                导出CSV
              </button>
              <button
                onClick={() => {
                  setIssueForm({ title: "", description: "", level: "minor", assignee: "" });
                  setShowIssueModal(true);
                }}
                className="btn-primary flex items-center gap-2 text-sm py-1.5"
              >
                <Plus className="w-4 h-4" />
                新增问题
              </button>
            </div>
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
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-800">{issue.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{issue.description}</p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getLevelColor(
                            issue.level
                          )}`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {getLevelText(issue.level)}
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
                        <div className="flex items-center gap-2">
                          {issue.status === "open" && (
                            <>
                              <button
                                onClick={() => openAssignModal(issue)}
                                className="text-primary-600 hover:text-primary-700 text-sm"
                              >
                                分派
                              </button>
                              <button
                                onClick={() => handleMarkProcessing(issue)}
                                className="text-green-600 hover:text-green-700 text-sm"
                              >
                                处理中
                              </button>
                            </>
                          )}
                          {issue.status === "processing" && (
                            <>
                              <button
                                onClick={() => openAssignModal(issue)}
                                className="text-primary-600 hover:text-primary-700 text-sm"
                              >
                                改派
                              </button>
                              <button
                                onClick={() => openCloseModal(issue)}
                                className="text-green-600 hover:text-green-700 text-sm"
                              >
                                关闭
                              </button>
                            </>
                          )}
                          {issue.status === "closed" && issue.resolution && (
                            <span className="text-xs text-gray-400" title={issue.resolution}>
                              已整改
                            </span>
                          )}
                        </div>
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
            <button
              onClick={() => {
                setShiftForm({
                  shiftType: "day",
                  incomingPerson: "",
                  waterSummary: "",
                  pendingCommands: "",
                  riskPoints: "",
                  notes: "",
                });
                setShowShiftModal(true);
              }}
              className="btn-primary flex items-center gap-2 text-sm py-1.5"
            >
              <Plus className="w-4 h-4" />
              新建交接
            </button>
          </div>
          <div className="space-y-4">
            {shiftHandovers.map((shift) => (
              <div
                key={shift.id}
                className={`data-card ${
                  shift.status === "pending_confirm"
                    ? "border-yellow-400 border-2 bg-yellow-50"
                    : ""
                }`}
              >
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
                        填写时间: {formatTime(shift.handoverTime)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      shift.status === "pending_confirm"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {shift.status === "pending_confirm" ? "待确认" : "已交接"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">交班人:</span>
                    <span className="text-gray-800 font-medium">{shift.outgoingPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">接班人:</span>
                    <span className="text-gray-800 font-medium">{shift.incomingPerson}</span>
                  </div>
                  {shift.status === "confirmed" && shift.confirmTime && (
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-gray-500">确认时间:</span>
                      <span className="text-gray-800">{formatTime(shift.confirmTime)}</span>
                    </div>
                  )}
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
                {shift.status === "pending_confirm" && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => confirmShiftHandover(shift.id)}
                      className="btn-primary flex items-center gap-2 text-sm py-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      确认交接
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">新增问题</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  问题标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入问题标题"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  问题描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请详细描述问题"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">严重程度</label>
                <div className="flex gap-2">
                  {[
                    { key: "critical", label: "严重", color: "red" },
                    { key: "major", label: "重要", color: "orange" },
                    { key: "minor", label: "一般", color: "yellow" },
                  ].map((level) => (
                    <label
                      key={level.key}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                        issueForm.level === level.key
                          ? level.color === "red"
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : level.color === "orange"
                            ? "bg-orange-100 text-orange-700 border border-orange-300"
                            : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="level"
                        checked={issueForm.level === level.key}
                        onChange={() => setIssueForm({ ...issueForm, level: level.key as any })}
                        className="hidden"
                      />
                      {level.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  责任人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={issueForm.assignee}
                  onChange={(e) => setIssueForm({ ...issueForm, assignee: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">请选择责任人</option>
                  {receivers.map((rec) => (
                    <option key={rec.id} value={rec.name}>
                      {rec.name} ({rec.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowIssueModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAddIssue} className="btn-primary">
                创建问题
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">分派责任人</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedIssue(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">{selectedIssue.title}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedIssue.description}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">选择责任人</label>
              <div className="space-y-2">
                {receivers.map((rec) => (
                  <label
                    key={rec.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      assignPerson === rec.name
                        ? "bg-primary-50 border border-primary-200"
                        : "bg-gray-50 border border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="assignee"
                      checked={assignPerson === rec.name}
                      onChange={() => setAssignPerson(rec.name)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{rec.name}</p>
                      <p className="text-xs text-gray-500">{rec.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedIssue(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleAssignIssue} className="btn-primary">
                确认分派
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">关闭问题</h3>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setSelectedIssue(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">{selectedIssue.title}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedIssue.description}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                整改说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请填写整改情况和结果..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setSelectedIssue(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleCloseIssue} className="btn-primary">
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">新建交接</h3>
              <button
                onClick={() => setShowShiftModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">班次类型</label>
                <div className="flex gap-2">
                  {[
                    { key: "day", label: "白班", color: "yellow" },
                    { key: "night", label: "夜班", color: "indigo" },
                  ].map((shift) => (
                    <label
                      key={shift.key}
                      className={`flex items-center gap-2 px-6 py-2 rounded-lg cursor-pointer transition-colors ${
                        shiftForm.shiftType === shift.key
                          ? shift.color === "yellow"
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-300"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shiftType"
                        checked={shiftForm.shiftType === shift.key}
                        onChange={() => setShiftForm({ ...shiftForm, shiftType: shift.key as any })}
                        className="hidden"
                      />
                      {shift.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  接班人 <span className="text-red-500">*</span>
                </label>
                <select
                  value={shiftForm.incomingPerson}
                  onChange={(e) => setShiftForm({ ...shiftForm, incomingPerson: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">请选择接班人</option>
                  {receivers.map((rec) => (
                    <option key={rec.id} value={rec.name}>
                      {rec.name} ({rec.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  当前水情摘要 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={shiftForm.waterSummary}
                  onChange={(e) => setShiftForm({ ...shiftForm, waterSummary: e.target.value })}
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请描述当前水情状况..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">未完成指令</label>
                <textarea
                  value={shiftForm.pendingCommands}
                  onChange={(e) => setShiftForm({ ...shiftForm, pendingCommands: e.target.value })}
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请列出未完成的调度指令..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">重点风险点</label>
                <textarea
                  value={shiftForm.riskPoints}
                  onChange={(e) => setShiftForm({ ...shiftForm, riskPoints: e.target.value })}
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请列出需要重点关注的风险点..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">下一班注意事项</label>
                <textarea
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请填写下一班需要注意的事项..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowShiftModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAddShift} className="btn-primary">
                创建交接
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
