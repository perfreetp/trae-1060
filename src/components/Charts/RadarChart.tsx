import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as echarts from "echarts";
import type { ChartRef } from "./LineChart";

interface RadarChartProps {
  indicators: { name: string; max: number }[];
  values: number[];
  title?: string;
  height?: number;
}

const RadarChart = forwardRef<ChartRef, RadarChartProps>(function RadarChart(
  {
    indicators,
    values,
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
              left: "center",
            }
          : undefined,
        tooltip: {
          backgroundColor: "rgba(255,255,255,0.95)",
          borderColor: "#e5e7eb",
          textStyle: { color: "#374151" },
        },
        radar: {
          indicator: indicators,
          shape: "polygon",
          splitNumber: 5,
          axisName: {
            color: "#6b7280",
            fontSize: 11,
          },
          splitLine: {
            lineStyle: { color: "#e5e7eb" },
          },
          splitArea: {
            areaStyle: {
              color: ["#f8fafc", "#f1f5f9", "#f8fafc", "#f1f5f9", "#f8fafc"],
            },
          },
          axisLine: {
            lineStyle: { color: "#e5e7eb" },
          },
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: values,
                name: "评分",
                areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: "rgba(62, 146, 204, 0.6)" },
                    { offset: 1, color: "rgba(10, 36, 99, 0.4)" },
                  ]),
                },
                lineStyle: {
                  color: "#3E92CC",
                  width: 2,
                },
                itemStyle: {
                  color: "#0A2463",
                },
              },
            ],
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
  }, [indicators, values, title]);

  return <div ref={chartRef} style={{ height }} />;
});

export default RadarChart;
