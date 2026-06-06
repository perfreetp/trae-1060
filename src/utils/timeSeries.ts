import type { TimeRange, RainfallStation, RiverStation, Reservoir } from "../types";

export const generateTimeLabels = (range: TimeRange): string[] => {
  const now = new Date();
  const labels: string[] = [];
  let step = 1;
  let count = 24;
  let format: "hour" | "day" = "hour";

  switch (range) {
    case "6h":
      step = 1;
      count = 6;
      format = "hour";
      break;
    case "24h":
      step = 2;
      count = 12;
      format = "hour";
      break;
    case "3d":
      step = 6;
      count = 12;
      format = "hour";
      break;
    case "7d":
      step = 1;
      count = 7;
      format = "day";
      break;
  }

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (format === "hour") {
      d.setHours(d.getHours() - i * step);
      labels.push(`${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}h`);
    } else {
      d.setDate(d.getDate() - i);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
  }
  return labels;
};

export const generateRandomSeries = (
  baseValue: number,
  variance: number,
  count: number,
  trend: "up" | "down" | "stable" = "stable"
): number[] => {
  const data: number[] = [];
  let value = baseValue;
  for (let i = 0; i < count; i++) {
    const randomFactor = (Math.random() - 0.5) * variance;
    const trendFactor = trend === "up" ? (i / count) * variance * 0.5 : trend === "down" ? -(i / count) * variance * 0.5 : 0;
    value = Math.max(0, baseValue + randomFactor + trendFactor);
    data.push(Math.round(value * 10) / 10);
  }
  return data;
};

export const getDataCount = (range: TimeRange): number => {
  switch (range) {
    case "6h": return 6;
    case "24h": return 12;
    case "3d": return 12;
    case "7d": return 7;
  }
};

// 计算某时段累计雨量
export const calcStationRainfall = (station: RainfallStation, timeRange: TimeRange): { totalRain: number; maxIntensity: number } => {
  const count = getDataCount(timeRange);
  const series = station.timeSeries || generateRandomSeries(station.currentRain, station.currentRain * 0.8, count, station.isAlert ? "up" : "stable");
  
  const totalRain = series.reduce((sum, val) => sum + val, 0);
  const maxIntensity = Math.max(...series);
  
  return {
    totalRain: Math.round(totalRain * 10) / 10,
    maxIntensity: Math.round(maxIntensity * 10) / 10,
  };
};

// 计算某时段最高水位
export const calcMaxLevel = (station: RiverStation, timeRange: TimeRange): { maxLevel: number; avgLevel: number } => {
  const count = getDataCount(timeRange);
  const series = station.timeSeries || generateRandomSeries(station.currentLevel, 0.5, count, station.trend);
  
  const maxLevel = Math.max(...series);
  const avgLevel = series.reduce((sum, val) => sum + val, 0) / series.length;
  
  return {
    maxLevel: Math.round(maxLevel * 100) / 100,
    avgLevel: Math.round(avgLevel * 100) / 100,
  };
};

// 计算某时段平均库容
export const calcAvgStorage = (reservoir: Reservoir, timeRange: TimeRange): { avgStorage: number; maxLevel: number } => {
  const count = getDataCount(timeRange);
  const storageSeries = reservoir.timeSeries || generateRandomSeries(reservoir.currentStorage, reservoir.currentStorage * 0.1, count, "stable");
  const levelSeries = generateRandomSeries(reservoir.currentLevel, 0.3, count, "stable");
  
  const avgStorage = storageSeries.reduce((sum, val) => sum + val, 0) / storageSeries.length;
  const maxLevel = Math.max(...levelSeries);
  
  return {
    avgStorage: Math.round(avgStorage * 100) / 100,
    maxLevel: Math.round(maxLevel * 100) / 100,
  };
};
