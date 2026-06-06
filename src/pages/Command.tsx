import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  CheckSquare,
  Clock,
  MessageCircle,
  Download,
  Phone,
  User,
  Calendar,
} from "lucide-react";
import StatusBadge from "../components/Common/StatusBadge";
import { commands, dispatchLogs } from "../data/command";
import { formatTime, getStatusColor } from "../utils/format";
import type { Command } from "../types";

export default function CommandPage() {
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(commands[0]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSendSms = (cmd: Command) => {
    alert(`短信已发送给: ${cmd.executor}\n内容: ${cmd.title}`);
  };

  const handleExecute = (cmd: Command) => {
    alert(`开始执行指令: ${cmd.title}`);
  };

  const handleSubmitFeedback = () => {
    alert(`执行反馈已提交:\n${feedback}`);
    setShowFeedbackModal(false);
    setFeedback("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          调度指令
        </h2>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出记录
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建指令
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-3">
          <h3 className="text-sm font-medium text-gray-600 mb-2">指令列表</h3>
          {commands.map((cmd) => (
            <div
              key={cmd.id}
              onClick={() => setSelectedCommand(cmd)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedCommand?.id === cmd.id
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-800 text-sm">{cmd.title}</h4>
                <StatusBadge status={cmd.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{cmd.executor}</span>
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

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">指令内容</h4>
                  <p className="text-gray-800">{selectedCommand.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">执行人</p>
                    <p className="font-medium text-gray-800">{selectedCommand.executor}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">执行状态</p>
                    <p className="font-medium">
                      <StatusBadge status={selectedCommand.status} />
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {selectedCommand.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleSendSms(selectedCommand)}
                        className="btn-secondary flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        发送短信提醒
                      </button>
                      <button
                        onClick={() => handleExecute(selectedCommand)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        开始执行
                      </button>
                    </>
                  )}
                  {selectedCommand.status === "executing" && (
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      执行回填
                    </button>
                  )}
                </div>
              </div>

              {selectedCommand.feedback && (
                <div className="data-card">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary-500" />
                    执行反馈
                  </h4>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-gray-800">{selectedCommand.feedback}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedCommand.completeTime &&
                        `完成时间: ${formatTime(selectedCommand.completeTime)}`}
                    </p>
                  </div>
                </div>
              )}
            </>
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
                        <span className="text-xs text-gray-500">{formatTime(log.time)}</span>
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

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px] animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">执行回填</h3>
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
    </div>
  );
}
