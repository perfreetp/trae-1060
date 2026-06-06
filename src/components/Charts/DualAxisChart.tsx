import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as echarts from "echarts";
import type { ChartRef } from "./LineChart";

interface DualAxisChartProps {
  leftData: number[];
  rightData: number[];
  xAxisData: string[];
  leftName: string;
  rightName: string;
  title?: string;
  height?: number;
}

const DualAxisChart = forwardRef<ChartRef, DualAxisChartProps>(function DualAxisChart(
  {
    leftData,
    rightData,
    xAxisData,
    leftName,
    rightName,
    title,
    height = 300,
  },
  ref
) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartInstance.current,
  }));

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);

      const option: echarts.EChartsOption = {
        title: title
          ? {
              text: title,
              textStyle: {
                fontSize: 14,
                fontWeight: 500,
                color: "#374151",
              },
              left: 0,
            }
          : undefined,
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderColor: "#e5e7eb",
          textStyle: { color: "#374151" },
        },
        legend: {
          data: [leftName, rightName],
          bottom: 0,
          textStyle: { fontSize: 12, color: "#6b7280" },
        },
        grid: {
          left: 50,
          right: 50,
          top: title ? 50 : 20,
          bottom: 40,
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLine: { lineStyle: { color: "#e5e7eb" } },
          axisLabel: { color: "#6b7280", fontSize: 11 },
        },
        yAxis: [
          {
            type: "value",
            name: leftName,
            position: "left",
            nameTextStyle: { color: "#3E92CC", fontSize: 11 },
            axisLine: { show: true, lineStyle: { color: "#3E92CC" } },
            axisTick: { show: false },
            axisLabel: { color: "#3E92CC", fontSize: 11 },
            splitLine: { lineStyle: { color: "#f3f4f6" } },
          },
          {
            type: "value",
            name: rightName,
            position: "right",
            nameTextStyle: { color: "#F77F00", fontSize: 11 },
            axisLine: { show: true, lineStyle: { color: "#F77F00" } },
            axisTick: { show: false },
            axisLabel: { color: "#F77F00", fontSize: 11 },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: leftName,
            type: "line",
            yAxisIndex: 0,
            data: leftData,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2, color: "#3E92CC" },
            itemStyle: { color: "#3E92CC" },
          },
          {
            name: rightName,
            type: "bar",
            yAxisIndex: 1,
            data: rightData,
            barWidth: "40%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#F77F00" },
                { offset: 1, color: "#FCBF49" },
              ]),
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      };

      chartInstance.current.setOption(option);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
    };
  }, [leftData, rightData, xAxisData, leftName, rightName, title]);

  return <div ref={chartRef} style={{ height }} />;
});

export default DualAxisChart;
