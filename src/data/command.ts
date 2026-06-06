import type { Command, DispatchLog, Scheme, AlertItem, SmsRecord } from "../types";

export const commands: Command[] = [
  {
    id: "cmd-001",
    title: "清江水库加大泄流量",
    content: "根据来水预报，预计未来24小时入库流量将达到500m³/s，请将清江水库泄洪闸开度调至60%，确保库水位控制在196m以下。",
    createTime: "2024-06-06 09:30:00",
    creator: "张调度",
    executor: "王值班",
    status: "executing",
    executeTime: "2024-06-06 09:45:00",
    smsSent: true,
  },
  {
    id: "cmd-002",
    title: "丹江口水库预泄",
    content: "根据上游来水增加，丹江口水库提前预泄，将出库流量增加至800m³/s，为后续洪水腾出库容。",
    createTime: "2024-06-06 08:00:00",
    creator: "李调度",
    executor: "刘值班",
    status: "completed",
    executeTime: "2024-06-06 08:15:00",
    completeTime: "2024-06-06 08:30:00",
    feedback: "已按指令调整出库流量至800m³/s，当前库水位160.2m，运行正常。",
    smsSent: true,
  },
  {
    id: "cmd-003",
    title: "三峡水库维持当前出库流量",
    content: "当前水情平稳，三峡水库维持出库流量10500m³/s不变，密切关注上游来水变化。",
    createTime: "2024-06-06 07:00:00",
    creator: "张调度",
    executor: "陈值班",
    status: "pending",
    smsSent: false,
  },
];

export const dispatchLogs: DispatchLog[] = [
  {
    id: "log-001",
    time: "2024-06-06 09:45:00",
    operator: "王值班",
    action: "执行调度指令",
    detail: "执行指令 cmd-001：清江水库泄洪闸开度调至60%",
  },
  {
    id: "log-002",
    time: "2024-06-06 09:30:00",
    operator: "张调度",
    action: "下达调度指令",
    detail: "下达指令 cmd-001：清江水库加大泄流量",
  },
  {
    id: "log-003",
    time: "2024-06-06 08:30:00",
    operator: "刘值班",
    action: "执行反馈",
    detail: "反馈指令 cmd-002 执行完成，出库流量调整至800m³/s",
  },
  {
    id: "log-004",
    time: "2024-06-06 08:15:00",
    operator: "刘值班",
    action: "执行调度指令",
    detail: "执行指令 cmd-002：丹江口水库出库流量调整",
  },
  {
    id: "log-005",
    time: "2024-06-06 08:00:00",
    operator: "李调度",
    action: "下达调度指令",
    detail: "下达指令 cmd-002：丹江口水库预泄",
  },
  {
    id: "log-006",
    time: "2024-06-06 07:30:00",
    operator: "系统",
    action: "阈值预警",
    detail: "襄阳雨量站降雨量超过警戒值，触发黄色预警",
  },
];

export const schemes: Scheme[] = [
  {
    id: "scheme-001",
    name: "2024年6月上旬联合调度方案",
    createTime: "2024-06-05 15:30:00",
    creator: "张调度",
    status: "approved",
    reservoirOperations: [
      {
        reservoirId: "res-001",
        reservoirName: "清江水库",
        targetLevel: 196.0,
        discharge: 600,
        startTime: "2024-06-06 08:00:00",
        endTime: "2024-06-07 20:00:00",
      },
      {
        reservoirId: "res-002",
        reservoirName: "丹江口水库",
        targetLevel: 158.0,
        discharge: 900,
        startTime: "2024-06-06 08:00:00",
        endTime: "2024-06-07 20:00:00",
      },
      {
        reservoirId: "res-003",
        reservoirName: "三峡水库",
        targetLevel: 152.0,
        discharge: 12000,
        startTime: "2024-06-06 08:00:00",
        endTime: "2024-06-07 20:00:00",
      },
    ],
    riskPoints: [
      {
        id: "rp-001",
        name: "沙市河段",
        lat: 30.31,
        lng: 112.24,
        level: "medium",
        description: "预计水位将接近警戒值，需密切关注",
      },
      {
        id: "rp-002",
        name: "宜昌港区",
        lat: 30.69,
        lng: 111.28,
        level: "low",
        description: "水位上涨可能影响港口作业",
      },
    ],
    simulationResult: {
      maxLevel: 42.5,
      totalDischarge: 13500,
      riskLevel: "中等",
    },
  },
  {
    id: "scheme-002",
    name: "应急调度方案（草案）",
    createTime: "2024-06-06 10:00:00",
    creator: "李调度",
    status: "draft",
    reservoirOperations: [
      {
        reservoirId: "res-001",
        reservoirName: "清江水库",
        targetLevel: 194.0,
        discharge: 800,
        startTime: "2024-06-06 12:00:00",
        endTime: "2024-06-08 08:00:00",
      },
    ],
    riskPoints: [],
    simulationResult: {
      maxLevel: 41.8,
      totalDischarge: 10000,
      riskLevel: "较低",
    },
  },
];

export const alerts: AlertItem[] = [
  {
    id: "alert-001",
    level: "danger",
    title: "襄阳雨量站超警戒",
    content: "襄阳雨量站日降雨量达85.3mm，超过警戒值50mm",
    time: "2024-06-06 11:30:00",
    source: "襄阳雨量站",
  },
  {
    id: "alert-002",
    level: "warning",
    title: "恩施雨量站超警戒",
    content: "恩施雨量站日降雨量达68.2mm，超过警戒值50mm",
    time: "2024-06-06 10:15:00",
    source: "恩施雨量站",
  },
  {
    id: "alert-003",
    level: "warning",
    title: "荆州雨量站超警戒",
    content: "荆州雨量站日降雨量达52.4mm，超过警戒值50mm",
    time: "2024-06-06 09:45:00",
    source: "荆州雨量站",
  },
  {
    id: "alert-004",
    level: "info",
    title: "沙市水文站水位上涨",
    content: "沙市水文站水位41.8m，接近警戒值43.0m",
    time: "2024-06-06 12:00:00",
    source: "沙市水文站",
  },
];

export const smsRecords: SmsRecord[] = [
  {
    id: "sms-001",
    commandId: "cmd-001",
    receiver: "王值班",
    receiverPhone: "13800138001",
    content: "【调度指令】cmd-001：清江水库加大泄流量，请将泄洪闸开度调至60%，确保库水位控制在196m以下。",
    sendTime: "2024-06-06 09:30:15",
    status: "sent",
  },
  {
    id: "sms-002",
    commandId: "cmd-001",
    receiver: "李主任",
    receiverPhone: "13800138002",
    content: "【调度指令】cmd-001：清江水库加大泄流量，请将泄洪闸开度调至60%，确保库水位控制在196m以下。",
    sendTime: "2024-06-06 09:30:20",
    status: "sent",
  },
  {
    id: "sms-003",
    commandId: "cmd-002",
    receiver: "刘值班",
    receiverPhone: "13800138003",
    content: "【调度指令】cmd-002：丹江口水库预泄，将出库流量增加至800m³/s。",
    sendTime: "2024-06-06 08:00:10",
    status: "sent",
  },
  {
    id: "sms-004",
    commandId: "cmd-003",
    receiver: "陈值班",
    receiverPhone: "13800138004",
    content: "【调度指令】cmd-003：三峡水库维持当前出库流量，当前水情平稳，维持出库流量10500m³/s不变。",
    sendTime: "2024-06-06 07:05:30",
    status: "failed",
  },
];

export const receivers = [
  { id: "r-001", name: "王值班", phone: "13800138001", role: "水库值班员" },
  { id: "r-002", name: "刘值班", phone: "13800138003", role: "水库值班员" },
  { id: "r-003", name: "陈值班", phone: "13800138004", role: "水库值班员" },
  { id: "r-004", name: "李主任", phone: "13800138002", role: "调度主任" },
  { id: "r-005", name: "赵科长", phone: "13800138005", role: "防汛科长" },
];
