import * as echarts from "echarts";
import type { ChartRef } from "../components/Charts/LineChart";

export const exportChartAsImage = (
  chartRef: ChartRef | null,
  pageName: string,
  entityName: string,
  timeRange: string
) => {
  if (!chartRef) return;
  const chart = chartRef.getEchartsInstance();
  const url = chart.getDataURL({
    type: "png",
    pixelRatio: 2,
    backgroundColor: "#fff",
  });
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `${pageName}_${entityName}_${timeRange}_${timestamp}.png`;
  link.href = url;
  link.click();
};

export const exportTableAsCSV = (
  headers: string[],
  rows: (string | number)[][],
  pageName: string,
  entityName: string,
  timeRange: string
) => {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `${pageName}_${entityName}_${timeRange}_${timestamp}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

export const timeRangeLabels: Record<string, string> = {
  "6h": "近6小时",
  "24h": "近24小时",
  "3d": "近3天",
  "7d": "近7天",
};
