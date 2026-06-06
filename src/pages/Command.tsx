import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Send,
  CheckSquare,
  Clock,
  Phone,
  User,
  Calendar,
  XCircle,
  CheckCircle2,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Square,
  CheckSquare as CheckSquareIcon,
} from "lucide-react";
import StatusBadge from "../components/Common/StatusBadge";
import { dispatchLogs, schemes } from "../data/command";
import { reservoirs } from "../data/reservoir";
import { formatTime } from "../utils/format";
import type { Command, CommandFormData } from "../types";
import { useAppStore } from "../store/useAppStore";

export default function CommandPage() {
  const { commands, smsRecords, receivers, currentUser, addCommand, updateCommandStatus, sendSms, batchSendSms, resendSms } =
    useAppStore();

  const [selectedCommand, setSelectedCommand] = useState<Command | null>(commands[0] || null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"detail" | "sms">("detail");
  const [feedback, setFeedback] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    pending: true,
    executing: true,
    completed: true,
  });

  const [formData, setFormData] = useState<CommandFormData>({
    title: "",
    content: "",
    reservoirIds: [],
    schemeId: "",
    receivers: [],
    deadline: "",
  });

  const [selectedSmsReceivers, setSelectedSmsReceivers] = useState<string[]>([]);
  const [selectedCommandIds, setSelectedCommandIds] = useState<string[]>([]);
  const [showBatchSmsModal, setShowBatchSmsModal] = useState(false);

  const pendingCommands = useMemo(
    () => commands.filter((c) => c.status === "pending"),
    [commands]
  );

  const allPendingSelected = useMemo(
    () => pendingCommands.length > 0 && pendingCommands.every((c) => selectedCommandIds.includes(c.id)),
    [pendingCommands, selectedCommandIds]
  );

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      pending: [],
      executing: [],
      completed: [],
    };
    commands.forEach((cmd) => {
      if (cmd.status === "cancelled") return;
      groups[cmd.status]?.push(cmd);
    });
    return groups;
  }, [commands]);

  const commandSmsRecords = useMemo(() => {
    if (!selectedCommand) return [];
    return smsRecords.filter((sms) => sms.commandId === selectedCommand.id);
  }, [smsRecords, selectedCommand]);

  const toggleGroup = (status: string) => {
    setExpandedGroups((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleImportFromScheme = (schemeId: string) => {
    if (!schemeId) {
      setFormData((prev) => ({ ...prev, schemeId: "" }));
      return;
    }
    
    const scheme = schemes.find((s) => s.id === schemeId);
    if (!scheme) return;

    const reservoirIds = scheme.reservoirOperations.map((op) => op.reservoirId);
    
    const startTime = scheme.reservoirOperations.reduce((earliest, op) => 
      new Date(op.startTime) < new Date(earliest) ? op.startTime : earliest, 
      scheme.reservoirOperations[0]?.startTime || ""
    );
    const endTime = scheme.reservoirOperations.reduce((latest, op) => 
      new Date(op.endTime) > new Date(latest) ? op.endTime : latest, 
      scheme.reservoirOperations[0]?.endTime || ""
    );

    const targetLevelDesc = scheme.reservoirOperations
      .map((op) => `${op.reservoirName}目标水位${op.targetLevel}m`)
      .join("，");

    setFormData((prev) => ({
      ...prev,
      schemeId,
      reservoirIds,
      title: prev.title || `基于方案「${scheme.name}」的调度指令`,
      content: `${prev.content ? prev.content + "\n\n" : ""}按方案「${scheme.name}」执行，控制目标：${targetLevelDesc}。执行时段：${startTime} 至 ${endTime}。`,
    }));
  };

  useEffect(() => {
    const schemeIdFromUrl = searchParams.get("schemeId");
    if (schemeIdFromUrl) {
      handleNewCommand();
      setTimeout(() => {
        handleImportFromScheme(schemeIdFromUrl);
      }, 0);
    }
    
    const commandIdFromUrl = searchParams.get("commandId");
    if (commandIdFromUrl) {
      const cmd = commands.find((c) => c.id === commandIdFromUrl);
      if (cmd) {
        setSelectedCommand(cmd);
      }
    }
  }, [searchParams, commands]);

  const handleNewCommand = () => {
    setFormData({
      title: "",
      content: "",
      reservoirIds: [],
      schemeId: "",
      receivers: [],
      deadline: "",
    });
    setShowNewModal(true);
  };

  const handleSubmitNew = () => {
    if (!formData.title || !formData.content || formData.receivers.length === 0) {
      alert("请填写完整信息");
      return;
    }
    addCommand(formData, currentUser.name);
    setShowNewModal(false);
  };

  const handleSendSms = () => {
    if (!selectedCommand) return;
    setSelectedSmsReceivers([]);
    setShowSmsModal(true);
  };

  const handleConfirmSms = () => {
    if (!selectedCommand || selectedSmsReceivers.length === 0) {
      alert("请选择接收人");
      return;
    }
    sendSms(selectedCommand.id, selectedSmsReceivers);
    setShowSmsModal(false);
    setSelectedSmsReceivers([]);
  };

  const handleToggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedCommandIds([]);
    } else {
      setSelectedCommandIds(pendingCommands.map((c) => c.id));
    }
  };

  const handleToggleCommandSelect = (commandId: string) => {
    setSelectedCommandIds((prev) =>
      prev.includes(commandId)
        ? prev.filter((id) => id !== commandId)
        : [...prev, commandId]
    );
  };

  const handleBatchSendSms = () => {
    if (selectedCommandIds.length === 0) {
      alert("请先选择要发送短信的指令");
      return;
    }
    setSelectedSmsReceivers([]);
    setShowBatchSmsModal(true);
  };

  const handleConfirmBatchSms = () => {
    if (selectedSmsReceivers.length === 0) {
      alert("请选择接收人");
      return;
    }
    batchSendSms(selectedCommandIds, selectedSmsReceivers);
    setShowBatchSmsModal(false);
    setSelectedSmsReceivers([]);
    setSelectedCommandIds([]);
  };

  const handleResendSms = (smsRecordId: string) => {
    resendSms(smsRecordId);
  };

  const handleStartExecute = (cmd: Command) => {
    updateCommandStatus(cmd.id, "executing");
    if (selectedCommand?.id === cmd.id) {
      setSelectedCommand({ ...cmd, status: "executing" });
    }
  };

  const handleSubmitFeedback = () => {
    if (!selectedCommand || !feedback) {
      alert("请填写执行反馈");
      return;
    }
    updateCommandStatus(selectedCommand.id, "completed", feedback);
    setShowFeedbackModal(false);
    setFeedback("");
  };

  const handleCancelCommand = (cmd: Command) => {
    if (confirm("确定要取消这条指令吗？")) {
      updateCommandStatus(cmd.id, "cancelled");
      if (selectedCommand?.id === cmd.id) {
        setSelectedCommand(null);
      }
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "待执行",
    executing: "执行中",
    completed: "已完成",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          调度指令
        </h2>
        <button
          onClick={handleNewCommand}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建指令
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">指令列表</h3>
          
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">批量操作</span>
              {selectedCommandIds.length > 0 && (
                <span className="text-xs text-primary-600 font-medium">
                  已选 {selectedCommandIds.length} 条
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {allPendingSelected ? (
                  <CheckSquareIcon className="w-4 h-4 text-primary-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>全选待执行</span>
              </button>
            </div>
            <button
              onClick={handleBatchSendSms}
              disabled={selectedCommandIds.length === 0}
              className={`w-full py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                selectedCommandIds.length > 0
                  ? "btn-primary"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Phone className="w-4 h-4" />
              批量发送短信提醒
            </button>
          </div>
          
          {(["pending", "executing", "completed"] as const).map((status) => (
            <div key={status} className="space-y-2">
              <button
                onClick={() => toggleGroup(status)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full"
              >
                {expandedGroups[status] ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
                <span>{statusLabels[status]}</span>
                <span className="text-gray-400">({groupedCommands[status]?.length || 0})</span>
              </button>
              
              {expandedGroups[status] && (
                <div className="space-y-2">
                  {groupedCommands[status]?.map((cmd) => (
                    <div
                      key={cmd.id}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedCommand?.id === cmd.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCommandSelect(cmd.id);
                            }}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {selectedCommandIds.includes(cmd.id) ? (
                              <CheckSquareIcon className="w-4 h-4 text-primary-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                        <div
                          onClick={() => setSelectedCommand(cmd)}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                              {cmd.title}
                            </h4>
                            <StatusBadge status={cmd.status} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            <span className="truncate">{cmd.executor}</span>
                            <span className="text-gray-300">|</span>
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(cmd.createTime)}</span>
                          </div>
                          {cmd.smsSent && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                              <Phone className="w-3 h-3" />
                              <span>短信已通知</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!groupedCommands[status]?.length && (
                    <div className="text-center text-sm text-gray-400 py-4">
                      暂无指令
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="col-span-2 space-y-6">
          {selectedCommand && (
            <>
              <div className="data-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {selectedCommand.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        创建人: {selectedCommand.creator}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatTime(selectedCommand.createTime)}
                      </span>
                      <StatusBadge status={selectedCommand.status} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-b border-gray-200 mb-4">
                  <button
                    onClick={() => setActiveTab("detail")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "detail"
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    指令详情
                  </button>
                  <button
                    onClick={() => setActiveTab("sms")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "sms"
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    短信记录 ({commandSmsRecords.length})
                  </button>
                </div>

                {activeTab === "detail" && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">指令内容</h4>
                      <p className="text-gray-800">{selectedCommand.content}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">执行人</p>
                        <p className="font-medium text-gray-800">
                          {selectedCommand.executor}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">执行状态</p>
                        <p className="font-medium">
                          <StatusBadge status={selectedCommand.status} />
                        </p>
                      </div>
                      {selectedCommand.executeTime && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">开始执行时间</p>
                          <p className="font-medium text-gray-800">
                            {formatTime(selectedCommand.executeTime)}
                          </p>
                        </div>
                      )}
                      {selectedCommand.completeTime && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">完成时间</p>
                          <p className="font-medium text-gray-800">
                            {formatTime(selectedCommand.completeTime)}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedCommand.feedback && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-100 mb-4">
                        <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          执行反馈
                        </h4>
                        <p className="text-gray-800">{selectedCommand.feedback}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {selectedCommand.status === "pending" && (
                        <>
                          <button
                            onClick={handleSendSms}
                            className="btn-secondary flex items-center gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            发送短信提醒
                          </button>
                          <button
                            onClick={() => handleStartExecute(selectedCommand)}
                            className="btn-primary flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            开始执行
                          </button>
                          <button
                            onClick={() => handleCancelCommand(selectedCommand)}
                            className="btn-secondary flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                            取消指令
                          </button>
                        </>
                      )}
                      {selectedCommand.status === "executing" && (
                        <>
                          <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="btn-primary flex items-center gap-2"
                          >
                            <CheckSquare className="w-4 h-4" />
                            执行回填
                          </button>
                          <button
                            onClick={handleSendSms}
                            className="btn-secondary flex items-center gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            发送短信提醒
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}

                {activeTab === "sms" && (
                  <div className="space-y-3">
                    {commandSmsRecords.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        暂无短信记录
                      </div>
                    ) : (
                      commandSmsRecords.map((sms) => (
                        <div
                          key={sms.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-800 text-sm">
                                {sms.receiver}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {sms.receiverPhone}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  sms.status === "sent"
                                    ? "bg-green-100 text-green-700"
                                    : sms.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {sms.status === "sent"
                                  ? "已发送"
                                  : sms.status === "failed"
                                  ? "发送失败"
                                  : "发送中"}
                              </span>
                              {sms.status === "failed" && (
                                <button
                                  onClick={() => handleResendSms(sms.id)}
                                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  重发
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{sms.content}</p>
                          <p className="text-xs text-gray-400">
                            发送时间: {formatTime(sms.sendTime)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {!selectedCommand && (
            <div className="data-card flex items-center justify-center py-16">
              <div className="text-center text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>请选择一条指令查看详情</p>
              </div>
            </div>
          )}

          <div className="data-card">
            <h4 className="font-semibold text-gray-800 mb-4">调度日志</h4>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {dispatchLogs.map((log, index) => (
                  <div key={log.id} className="relative pl-10">
                    <div
                      className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 border-white ${
                        index === 0 ? "bg-primary-500" : "bg-gray-300"
                      }`}
                    />
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-800">
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
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[600px] max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">新建调度指令</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  指令标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入指令标题"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  指令内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入指令内容"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">关联水库</label>
                <div className="flex flex-wrap gap-2">
                  {reservoirs.map((res) => (
                    <label
                      key={res.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                        formData.reservoirIds.includes(res.id)
                          ? "bg-primary-100 text-primary-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.reservoirIds.includes(res.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              reservoirIds: [...formData.reservoirIds, res.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              reservoirIds: formData.reservoirIds.filter(
                                (id) => id !== res.id
                              ),
                            });
                          }
                        }}
                        className="hidden"
                      />
                      {res.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">从方案导入</label>
                <div className="flex gap-2">
                  <select
                    value={formData.schemeId}
                    onChange={(e) => handleImportFromScheme(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">请选择方案导入</option>
                    {schemes.map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.schemeId && (
                  <p className="text-xs text-primary-600 mt-1">
                    ✓ 已从方案导入水库、时段和控制目标信息
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  接收人 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {receivers.map((rec) => (
                    <label
                      key={rec.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                        formData.receivers.includes(rec.id)
                          ? "bg-primary-100 text-primary-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.receivers.includes(rec.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              receivers: [...formData.receivers, rec.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              receivers: formData.receivers.filter(
                                (id) => id !== rec.id
                              ),
                            });
                          }
                        }}
                        className="hidden"
                      />
                      {rec.name} ({rec.role})
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  要求完成时间
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSubmitNew} className="btn-primary">
                创建指令
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">执行回填</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">执行情况反馈</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入执行情况和结果..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSubmitFeedback} className="btn-primary">
                提交反馈
              </button>
            </div>
          </div>
        </div>
      )}

      {showSmsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">发送短信提醒</h3>
              <button
                onClick={() => setShowSmsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">选择接收人</label>
              <div className="space-y-2">
                {receivers.map((rec) => (
                  <label
                    key={rec.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSmsReceivers.includes(rec.id)
                        ? "bg-primary-50 border border-primary-200"
                        : "bg-gray-50 border border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSmsReceivers.includes(rec.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSmsReceivers([
                            ...selectedSmsReceivers,
                            rec.id,
                          ]);
                        } else {
                          setSelectedSmsReceivers(
                            selectedSmsReceivers.filter((id) => id !== rec.id)
                          );
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {rec.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rec.phone} · {rec.role}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSmsModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleConfirmSms} className="btn-primary">
                发送短信
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchSmsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">批量发送短信提醒</h3>
              <button
                onClick={() => setShowBatchSmsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-2 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-sm text-primary-700">
                已选择 <span className="font-semibold">{selectedCommandIds.length}</span> 条指令
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">选择接收人</label>
              <div className="space-y-2">
                {receivers.map((rec) => (
                  <label
                    key={rec.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSmsReceivers.includes(rec.id)
                        ? "bg-primary-50 border border-primary-200"
                        : "bg-gray-50 border border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSmsReceivers.includes(rec.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSmsReceivers([
                            ...selectedSmsReceivers,
                            rec.id,
                          ]);
                        } else {
                          setSelectedSmsReceivers(
                            selectedSmsReceivers.filter((id) => id !== rec.id)
                          );
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {rec.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rec.phone} · {rec.role}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBatchSmsModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleConfirmBatchSms} className="btn-primary">
                批量发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
