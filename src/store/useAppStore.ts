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
} from "../types";
import { reservoirs } from "../data/reservoir";
import { alerts, commands, smsRecords, receivers } from "../data/command";
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
  setSelectedReservoir: (reservoir: Reservoir | null) => void;
  setTimeRange: (range: TimeRange) => void;
  addAlert: (alert: AlertItem) => void;
  updateCommandStatus: (id: string, status: Command["status"], feedback?: string) => void;
  addCommand: (data: CommandFormData, creator: string) => void;
  sendSms: (commandId: string, receiverIds: string[]) => void;
  batchSendSms: (commandIds: string[], receiverIds: string[]) => void;
  resendSms: (smsRecordId: string) => void;
  addIssue: (data: IssueFormData, creator: string) => void;
  updateIssueStatus: (id: string, status: Issue["status"], resolution?: string) => void;
  assignIssue: (id: string, assignee: string) => void;
  addShiftHandover: (data: ShiftHandoverFormData, outgoingPerson: string) => void;
  confirmShiftHandover: (id: string) => void;
  getCommandsBySchemeId: (schemeId: string) => Command[];
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
      status: "pending",
      smsSent: false,
      schemeId: data.schemeId,
    };
    set((state) => ({ commands: [newCommand, ...state.commands] }));
    return newCommand.id;
  },
  sendSms: (commandId, receiverIds) => {
    const command = get().commands.find((c) => c.id === commandId);
    const allReceivers = get().receivers;
    if (!command) return;
    const newRecords: SmsRecord[] = receiverIds.map((rid, idx) => {
      const receiver = allReceivers.find((r) => r.id === rid);
      return {
        id: `sms-${Date.now()}-${idx}`,
        commandId,
        receiver: receiver?.name || "未知",
        receiverPhone: receiver?.phone || "",
        content: `【调度指令】${command.title}：${command.content.slice(0, 50)}...`,
        sendTime: new Date().toLocaleString("zh-CN"),
        status: "sent" as const,
      };
    });
    set((state) => ({
      smsRecords: [...newRecords, ...state.smsRecords],
      commands: state.commands.map((c) =>
        c.id === commandId ? { ...c, smsSent: true } : c
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
      keyPoints: `水情摘要：${data.waterSummary}`,
      pendingTasks: `未完成指令：${data.pendingCommands}；风险点：${data.riskPoints}`,
      remarks: data.notes,
      status: "pending_confirm",
    };
    set((state) => ({ shiftHandovers: [newShift, ...state.shiftHandovers] }));
  },
  confirmShiftHandover: (id) =>
    set((state) => ({
      shiftHandovers: state.shiftHandovers.map((shift) =>
        shift.id === id
          ? {
              ...shift,
              status: "confirmed",
              confirmTime: new Date().toLocaleString("zh-CN"),
            }
          : shift
      ),
    })),
  getCommandsBySchemeId: (schemeId) => {
    return get().commands.filter((cmd) => cmd.schemeId === schemeId);
  },
}));
