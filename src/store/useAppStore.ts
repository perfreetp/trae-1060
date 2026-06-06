import { create } from "zustand";
import type {
  Reservoir,
  AlertItem,
  Command,
  TimeRange,
  SmsRecord,
  Issue,
  ShiftHandover,
  CommandFormData,
  IssueFormData,
  ShiftHandoverFormData,
  SchemeVersion,
  ReservoirOperation,
  SmsTemplate,
} from "../types";
import { reservoirs } from "../data/reservoir";
import { alerts, commands, smsRecords, receivers, schemeVersions, smsTemplates } from "../data/command";
import { issues, shiftHandovers } from "../data/review";

interface AppState {
  selectedReservoir: Reservoir | null;
  alerts: AlertItem[];
  commands: Command[];
  smsRecords: SmsRecord[];
  issues: Issue[];
  shiftHandovers: ShiftHandover[];
  timeRange: TimeRange;
  currentUser: {
    name: string;
    role: string;
  };
  receivers: { id: string; name: string; phone: string; role: string }[];
  schemeVersions: SchemeVersion[];
  smsTemplates: SmsTemplate[];
  setSelectedReservoir: (reservoir: Reservoir | null) => void;
  setTimeRange: (range: TimeRange) => void;
  addAlert: (alert: AlertItem) => void;
  updateCommandStatus: (id: string, status: Command["status"], feedback?: string) => void;
  addCommand: (data: CommandFormData, creator: string) => void;
  sendSms: (commandId: string, receiverIds: string[], templateId?: string, customContent?: string) => void;
  batchSendSms: (commandIds: string[], receiverIds: string[]) => void;
  resendSms: (smsRecordId: string) => void;
  addIssue: (data: IssueFormData, creator: string) => void;
  updateIssueStatus: (id: string, status: Issue["status"], resolution?: string) => void;
  assignIssue: (id: string, assignee: string) => void;
  addShiftHandover: (data: ShiftHandoverFormData, outgoingPerson: string) => void;
  confirmShiftHandover: (id: string, checklist?: Record<string, boolean>) => void;
  getCommandsBySchemeId: (schemeId: string) => Command[];
  createVersion: (schemeId: string, operations: ReservoirOperation[], description: string, creator: string) => void;
  getVersionsBySchemeId: (schemeId: string) => SchemeVersion[];
  rollbackToVersion: (schemeId: string, versionId: string) => ReservoirOperation[] | null;
  submitForApproval: (commandId: string) => void;
  approveCommand: (commandId: string, approver: string) => void;
  rejectCommand: (commandId: string, reason: string, approver: string) => void;
  confirmCompletion: (commandId: string, confirmer: string) => void;
  returnForReexecution: (commandId: string, reason: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedReservoir: reservoirs[0],
  alerts: alerts,
  commands: commands,
  smsRecords: smsRecords,
  issues: issues,
  shiftHandovers: shiftHandovers,
  timeRange: "24h",
  currentUser: {
    name: "张调度",
    role: "调度员",
  },
  receivers: receivers,
  schemeVersions: schemeVersions,
  smsTemplates: smsTemplates,
  setSelectedReservoir: (reservoir) => set({ selectedReservoir: reservoir }),
  setTimeRange: (range) => set({ timeRange: range }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),
  updateCommandStatus: (id, status, feedback) =>
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === id
          ? {
              ...cmd,
              status,
              ...(status === "executing" && { executeTime: new Date().toLocaleString("zh-CN") }),
              ...(status === "completed" && {
                completeTime: new Date().toLocaleString("zh-CN"),
                feedback,
              }),
            }
          : cmd
      ),
    })),
  addCommand: (data, creator) => {
    const newCommand: Command = {
      id: `cmd-${Date.now()}`,
      title: data.title,
      content: data.content,
      createTime: new Date().toLocaleString("zh-CN"),
      creator,
      executor: data.receivers.join(", "),
      status: "pending_approval",
      smsSent: false,
      schemeId: data.schemeId,
    };
    set((state) => ({ commands: [newCommand, ...state.commands] }));
    return newCommand.id;
  },
  sendSms: (commandId, receiverIds, templateId, customContent) => {
    const command = get().commands.find((c) => c.id === commandId);
    const allReceivers = get().receivers;
    const templates = get().smsTemplates;
    if (!command) return;
    
    let smsContent = customContent;
    if (!smsContent && templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        smsContent = template.content;
        const variables: Record<string, string> = {
          "指令标题": command.title,
          "执行人": command.executor,
        };
        Object.keys(variables).forEach((key) => {
          smsContent = smsContent?.replace(new RegExp(`\\{${key}\\}`, "g"), variables[key]);
        });
      }
    }
    if (!smsContent) {
      smsContent = `【调度指令】${command.title}：${command.content.slice(0, 50)}...`;
    }
    
    const newRecords: SmsRecord[] = receiverIds.map((rid, idx) => {
      const receiver = allReceivers.find((r) => r.id === rid);
      return {
        id: `sms-${Date.now()}-${idx}`,
        commandId,
        receiver: receiver?.name || "未知",
        receiverPhone: receiver?.phone || "",
        content: smsContent!,
        sendTime: new Date().toLocaleString("zh-CN"),
        status: "sent" as const,
      };
    });
    set((state) => ({
      smsRecords: [...newRecords, ...state.smsRecords],
      commands: state.commands.map((c) =>
        c.id === commandId ? { ...c, smsSent: true, smsTemplateId: templateId } : c
      ),
    }));
  },
  batchSendSms: (commandIds, receiverIds) => {
    const { commands, receivers: allReceivers } = get();
    const allNewRecords: SmsRecord[] = [];
    let recordIndex = 0;
    
    commandIds.forEach((commandId) => {
      const command = commands.find((c) => c.id === commandId);
      if (!command) return;
      
      receiverIds.forEach((rid) => {
        const receiver = allReceivers.find((r) => r.id === rid);
        allNewRecords.push({
          id: `sms-${Date.now()}-${recordIndex++}`,
          commandId,
          receiver: receiver?.name || "未知",
          receiverPhone: receiver?.phone || "",
          content: `【调度指令】${command.title}：${command.content.slice(0, 50)}...`,
          sendTime: new Date().toLocaleString("zh-CN"),
          status: "sent" as const,
        });
      });
    });
    
    set((state) => ({
      smsRecords: [...allNewRecords, ...state.smsRecords],
      commands: state.commands.map((c) =>
        commandIds.includes(c.id) ? { ...c, smsSent: true } : c
      ),
    }));
  },
  resendSms: (smsRecordId) => {
    const { smsRecords } = get();
    const originalRecord = smsRecords.find((s) => s.id === smsRecordId);
    if (!originalRecord) return;
    
    const newRecord: SmsRecord = {
      ...originalRecord,
      id: `sms-${Date.now()}`,
      sendTime: new Date().toLocaleString("zh-CN"),
      status: "sent",
    };
    
    set((state) => ({
      smsRecords: [newRecord, ...state.smsRecords],
    }));
  },
  addIssue: (data, creator) => {
    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      title: data.title,
      description: data.description,
      level: data.level,
      status: "open",
      assignee: data.assignee,
      createTime: new Date().toLocaleString("zh-CN"),
    };
    set((state) => ({ issues: [newIssue, ...state.issues] }));
  },
  updateIssueStatus: (id, status, resolution) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === id
          ? {
              ...issue,
              status,
              ...(status === "closed" && {
                resolveTime: new Date().toLocaleString("zh-CN"),
                resolution,
              }),
            }
          : issue
      ),
    })),
  assignIssue: (id, assignee) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === id ? { ...issue, assignee } : issue
      ),
    })),
  addShiftHandover: (data, outgoingPerson) => {
    const newShift: ShiftHandover = {
      id: `shift-${Date.now()}`,
      shiftType: data.shiftType,
      handoverTime: new Date().toLocaleString("zh-CN"),
      outgoingPerson,
      incomingPerson: data.incomingPerson,
      keyPoints: `雨情：${data.rainfallSummary || "无"}；水情：${data.waterLevelSummary || "无"}；库情：${data.storageSummary || "无"}`,
      pendingTasks: `未完成指令：${data.pendingCommands}；风险点：${data.riskPoints}`,
      remarks: data.notes,
      status: "pending_confirm",
      rainfallSummary: data.rainfallSummary,
      waterLevelSummary: data.waterLevelSummary,
      storageSummary: data.storageSummary,
    };
    set((state) => ({ shiftHandovers: [newShift, ...state.shiftHandovers] }));
  },
  confirmShiftHandover: (id, checklist) =>
    set((state) => ({
      shiftHandovers: state.shiftHandovers.map((shift) =>
        shift.id === id
          ? {
              ...shift,
              status: "confirmed",
              confirmTime: new Date().toLocaleString("zh-CN"),
              ...(checklist ? { checklist } : {}),
            }
          : shift
      ),
    })),
  getCommandsBySchemeId: (schemeId) => {
    return get().commands.filter((cmd) => cmd.schemeId === schemeId);
  },
  createVersion: (schemeId, operations, description, creator) => {
    const versions = get().getVersionsBySchemeId(schemeId);
    const maxVersion = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) : 0;
    const newVersion: SchemeVersion = {
      id: `version-${Date.now()}`,
      schemeId,
      versionNumber: maxVersion + 1,
      name: `v${maxVersion + 1} - ${description.slice(0, 20)}`,
      createTime: new Date().toLocaleString("zh-CN"),
      creator,
      description,
      reservoirOperations: operations,
    };
    set((state) => ({
      schemeVersions: [...state.schemeVersions, newVersion],
    }));
  },
  getVersionsBySchemeId: (schemeId) => {
    return get().schemeVersions.filter((v) => v.schemeId === schemeId);
  },
  rollbackToVersion: (schemeId, versionId) => {
    const version = get().schemeVersions.find((v) => v.id === versionId && v.schemeId === schemeId);
    if (!version) return null;
    return version.reservoirOperations;
  },
  submitForApproval: (commandId) => {
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === commandId
          ? { ...cmd, status: "pending_approval" }
          : cmd
      ),
    }));
  },
  approveCommand: (commandId, approver) => {
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === commandId
          ? {
              ...cmd,
              status: "pending",
              approvalTime: new Date().toLocaleString("zh-CN"),
              approver,
            }
          : cmd
      ),
    }));
  },
  rejectCommand: (commandId, reason, approver) => {
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === commandId
          ? {
              ...cmd,
              status: "rejected",
              approvalTime: new Date().toLocaleString("zh-CN"),
              approver,
              rejectReason: reason,
            }
          : cmd
      ),
    }));
  },
  confirmCompletion: (commandId, confirmer) => {
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === commandId
          ? {
              ...cmd,
              confirmTime: new Date().toLocaleString("zh-CN"),
              confirmer,
            }
          : cmd
      ),
    }));
  },
  returnForReexecution: (commandId, reason) => {
    set((state) => ({
      commands: state.commands.map((cmd) =>
        cmd.id === commandId
          ? {
              ...cmd,
              status: "executing",
              rejectReason: reason,
            }
          : cmd
      ),
    }));
  },
}));
