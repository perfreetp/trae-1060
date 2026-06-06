import type { HistoricalFlood, ReviewScore, Issue, ShiftHandover, DispatchLog } from "../types";

export interface FloodDetail extends HistoricalFlood {
  rainfallData: number[];
  levelData: number[];
  timeLabels: string[];
  dispatchCommands: DispatchLog[];
  relatedIssueIds: string[];
  relatedScoreId?: string;
}

export const historicalFloods: FloodDetail[] = [
  {
    id: "flood-001",
    name: "2020年长江第1号洪水",
    startTime: "2020-07-02",
    endTime: "2020-07-15",
    maxRainfall: 285.6,
    maxLevel: 45.2,
    affectedReservoirs: ["三峡水库", "葛洲坝水库"],
    rainfallData: [12, 25, 45, 68, 52, 38, 22, 15, 8, 5, 12, 28, 42, 35],
    levelData: [42.1, 42.5, 43.0, 43.8, 44.5, 45.0, 45.2, 45.1, 44.8, 44.5, 44.2, 43.8, 43.5, 43.2],
    timeLabels: ["7-02", "7-03", "7-04", "7-05", "7-06", "7-07", "7-08", "7-09", "7-10", "7-11", "7-12", "7-13", "7-14", "7-15"],
    dispatchCommands: [
      { id: "log-1", time: "2020-07-04 08:00:00", operator: "李调度", action: "下达调度指令", detail: "三峡水库出库流量增加至30000m³/s" },
      { id: "log-2", time: "2020-07-05 10:30:00", operator: "王值班", action: "执行调度指令", detail: "三峡水库按指令调整出库流量" },
      { id: "log-3", time: "2020-07-06 14:00:00", operator: "李调度", action: "下达调度指令", detail: "葛洲坝水库配合三峡调度，调整出库流量" },
      { id: "log-4", time: "2020-07-08 09:00:00", operator: "张主任", action: "启动应急响应", detail: "启动防汛Ⅲ级应急响应" },
      { id: "log-5", time: "2020-07-10 16:00:00", operator: "李调度", action: "下达调度指令", detail: "三峡水库逐步减小出库流量" },
    ],
    relatedIssueIds: ["issue-002"],
    relatedScoreId: "score-002",
  },
  {
    id: "flood-002",
    name: "2021年汉江秋汛",
    startTime: "2021-09-20",
    endTime: "2021-10-05",
    maxRainfall: 198.3,
    maxLevel: 42.8,
    affectedReservoirs: ["丹江口水库", "三峡水库"],
    rainfallData: [8, 15, 28, 42, 55, 38, 25, 18, 12, 22, 35, 28, 18, 12, 8, 5],
    levelData: [40.2, 40.5, 41.0, 41.6, 42.2, 42.6, 42.8, 42.7, 42.5, 42.2, 41.8, 41.5, 41.2, 41.0, 40.8, 40.6],
    timeLabels: ["9-20", "9-21", "9-22", "9-23", "9-24", "9-25", "9-26", "9-27", "9-28", "9-29", "9-30", "10-01", "10-02", "10-03", "10-04", "10-05"],
    dispatchCommands: [
      { id: "log-1", time: "2021-09-22 08:00:00", operator: "张调度", action: "下达调度指令", detail: "丹江口水库开始预泄，出库流量增至800m³/s" },
      { id: "log-2", time: "2021-09-24 14:00:00", operator: "刘值班", action: "执行调度指令", detail: "丹江口水库按指令调整出库流量" },
      { id: "log-3", time: "2021-09-26 10:00:00", operator: "张调度", action: "下达调度指令", detail: "丹江口水库出库流量增至1200m³/s" },
      { id: "log-4", time: "2021-09-28 16:00:00", operator: "张调度", action: "下达调度指令", detail: "三峡水库配合汉江调度，适当减小出库" },
    ],
    relatedIssueIds: [],
    relatedScoreId: undefined,
  },
  {
    id: "flood-003",
    name: "2022年长江流域干旱",
    startTime: "2022-07-10",
    endTime: "2022-08-30",
    maxRainfall: 85.2,
    maxLevel: 38.5,
    affectedReservoirs: ["三峡水库", "清江水库"],
    rainfallData: [5, 3, 8, 2, 5, 10, 8, 3, 2, 5, 8, 12, 5, 3, 2, 5, 8, 5, 3, 2],
    levelData: [42.5, 42.2, 41.8, 41.5, 41.2, 40.8, 40.5, 40.2, 39.8, 39.5, 39.2, 38.8, 38.5, 38.6, 38.8, 39.0, 39.2, 39.5, 39.8, 40.0],
    timeLabels: ["7-10", "7-15", "7-20", "7-25", "7-30", "8-04", "8-09", "8-14", "8-19", "8-24", "8-29", "9-03", "9-08", "9-13", "9-18", "9-23", "9-28", "10-03", "10-08", "10-13"],
    dispatchCommands: [
      { id: "log-1", time: "2022-07-20 08:00:00", operator: "李调度", action: "下达调度指令", detail: "三峡水库加大下泄流量，保障下游供水" },
      { id: "log-2", time: "2022-08-01 10:00:00", operator: "张主任", action: "启动应急响应", detail: "启动抗旱Ⅳ级应急响应" },
      { id: "log-3", time: "2022-08-15 14:00:00", operator: "李调度", action: "下达调度指令", detail: "三峡水库继续维持大流量下泄" },
    ],
    relatedIssueIds: ["issue-001"],
    relatedScoreId: undefined,
  },
  {
    id: "flood-004",
    name: "2023年梅雨期洪水",
    startTime: "2023-06-15",
    endTime: "2023-07-05",
    maxRainfall: 215.8,
    maxLevel: 43.6,
    affectedReservoirs: ["三峡水库", "丹江口水库", "清江水库"],
    rainfallData: [15, 28, 45, 38, 52, 68, 45, 32, 22, 18, 25, 35, 28, 18, 12, 8, 15, 22, 18, 12],
    levelData: [41.5, 41.8, 42.2, 42.5, 42.9, 43.2, 43.5, 43.6, 43.5, 43.3, 43.0, 42.8, 42.5, 42.2, 42.0, 41.8, 41.6, 41.5, 41.4, 41.3],
    timeLabels: ["6-15", "6-16", "6-17", "6-18", "6-19", "6-20", "6-21", "6-22", "6-23", "6-24", "6-25", "6-26", "6-27", "6-28", "6-29", "6-30", "7-01", "7-02", "7-03", "7-04"],
    dispatchCommands: [
      { id: "log-1", time: "2023-06-17 08:00:00", operator: "张调度", action: "下达调度指令", detail: "三峡水库出库流量调整至20000m³/s" },
      { id: "log-2", time: "2023-06-18 10:30:00", operator: "张调度", action: "下达调度指令", detail: "丹江口水库启动预泄" },
      { id: "log-3", time: "2023-06-19 14:00:00", operator: "王值班", action: "执行调度指令", detail: "清江水库泄洪闸开度调至50%" },
      { id: "log-4", time: "2023-06-20 09:00:00", operator: "张主任", action: "启动应急响应", detail: "启动防汛Ⅳ级应急响应" },
      { id: "log-5", time: "2023-06-21 16:00:00", operator: "张调度", action: "下达调度指令", detail: "三峡水库出库流量增至25000m³/s" },
      { id: "log-6", time: "2023-06-25 10:00:00", operator: "张调度", action: "下达调度指令", detail: "各水库逐步减小出库流量" },
    ],
    relatedIssueIds: ["issue-003"],
    relatedScoreId: "score-001",
  },
];

export const reviewScores: ReviewScore[] = [
  {
    id: "score-001",
    floodId: "flood-004",
    dimensions: {
      forecastAccuracy: 85,
      schemeRationality: 88,
      executionTimeliness: 92,
      disasterReduction: 90,
      collaboration: 87,
    },
    totalScore: 88.4,
    reviewer: "张主任",
    reviewTime: "2023-07-10 15:30:00",
  },
  {
    id: "score-002",
    floodId: "flood-001",
    dimensions: {
      forecastAccuracy: 78,
      schemeRationality: 82,
      executionTimeliness: 85,
      disasterReduction: 88,
      collaboration: 80,
    },
    totalScore: 82.6,
    reviewer: "李总工",
    reviewTime: "2020-07-20 10:00:00",
  },
];

export const issues: Issue[] = [
  {
    id: "issue-001",
    title: "恩施雨量站数据传输延迟",
    description: "恩施雨量站数据传输存在5-10分钟延迟，影响实时监测时效性",
    level: "major",
    status: "processing",
    assignee: "运维组-小王",
    createTime: "2024-06-05 14:30:00",
  },
  {
    id: "issue-002",
    title: "丹江口水库泄流曲线需要重新率定",
    description: "根据最新观测数据，丹江口水库泄流曲线与实际存在偏差",
    level: "critical",
    status: "open",
    assignee: "水文组-李工",
    createTime: "2024-06-04 09:00:00",
  },
  {
    id: "issue-003",
    title: "短信平台接口不稳定",
    description: "调度指令短信发送偶有失败，需要排查接口问题",
    level: "minor",
    status: "closed",
    assignee: "信息组-张工",
    createTime: "2024-06-01 11:20:00",
    resolveTime: "2024-06-03 16:00:00",
    resolution: "已更换短信平台服务商，接口稳定运行",
  },
];

export const shiftHandovers: ShiftHandover[] = [
  {
    id: "shift-001",
    shiftType: "day",
    handoverTime: "2024-06-06 08:00:00",
    outgoingPerson: "夜班-李值班",
    incomingPerson: "白班-王值班",
    keyPoints: "1. 清江水库当前水位198.5m，接近汛限水位；2. 丹江口水库正在执行预泄指令；3. 襄阳、恩施、荆州雨量站超警戒。",
    pendingTasks: "1. 密切关注清江水库水位变化，适时调整泄量；2. 跟踪丹江口预泄执行情况；3. 今日10点会商准备调度例会。",
    remarks: "水情整体平稳，需防范局地强降雨",
    status: "pending_confirm",
  },
  {
    id: "shift-002",
    shiftType: "night",
    handoverTime: "2024-06-05 20:00:00",
    outgoingPerson: "白班-张值班",
    incomingPerson: "夜班-李值班",
    keyPoints: "1. 白天流域内有分散性阵雨，部分站点降雨量较大；2. 三峡水库维持当前出库流量不变。",
    pendingTasks: "1. 夜间关注夜间降雨情况；2. 每2小时巡查一次关键站点数据。",
    remarks: "注意夜间值班纪律",
    status: "confirmed",
    confirmTime: "2024-06-05 20:15:00",
  },
];
