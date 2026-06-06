import type { HistoricalFlood, ReviewScore, Issue, ShiftHandover } from "../types";

export const historicalFloods: HistoricalFlood[] = [
  {
    id: "flood-001",
    name: "2020年长江第1号洪水",
    startTime: "2020-07-02",
    endTime: "2020-07-15",
    maxRainfall: 285.6,
    maxLevel: 45.2,
    affectedReservoirs: ["三峡水库", "葛洲坝水库"],
  },
  {
    id: "flood-002",
    name: "2021年汉江秋汛",
    startTime: "2021-09-20",
    endTime: "2021-10-05",
    maxRainfall: 198.3,
    maxLevel: 42.8,
    affectedReservoirs: ["丹江口水库", "三峡水库"],
  },
  {
    id: "flood-003",
    name: "2022年长江流域干旱",
    startTime: "2022-07-10",
    endTime: "2022-08-30",
    maxRainfall: 85.2,
    maxLevel: 38.5,
    affectedReservoirs: ["三峡水库", "清江水库"],
  },
  {
    id: "flood-004",
    name: "2023年梅雨期洪水",
    startTime: "2023-06-15",
    endTime: "2023-07-05",
    maxRainfall: 215.8,
    maxLevel: 43.6,
    affectedReservoirs: ["三峡水库", "丹江口水库", "清江水库"],
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
  },
];
