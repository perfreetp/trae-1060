import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as echarts from "echarts";

export interface ChartRef {
  getEchartsInstance: () => echarts.ECharts | null;
}

interface LineChartProps {
  data: {
    name: string;
    values: number[];
    color?: string;
  }[];
  xAxisData: string[];
  title?: string;
  yAxisName?: string;
  height?: number;
  showLegend?: boolean;
}

const LineChart = forwardRef<ChartRef, LineChartProps>(function LineChart(
  {
    data,
    xAxisData,
    title,
    yAxisName,
    height = 300,
    showLegend = true,
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
        legend: showLegend
          ? {
              data: data.map((d) => d.name),
              bottom: 0,
              textStyle: { fontSize: 12, color: "#6b7280" },
            }
          : undefined,
        grid: {
          left: 50,
          right: 20,
          top: title ? 50 : 20,
          bottom: showLegend ? 40 : 20,
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLine: { lineStyle: { color: "#e5e7eb" } },
          axisLabel: { color: "#6b7280", fontSize: 11 },
        },
        yAxis: {
          type: "value",
          name: yAxisName,
          nameTextStyle: { color: "#6b7280", fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: "#6b7280", fontSize: 11 },
          splitLine: { lineStyle: { color: "#f3f4f6" } },
        },
        series: data.map((d, index) => ({
          name: d.name,
          type: "line",
          data: d.values,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: d.color || ["#3E92CC", "#F77F00", "#D62828", "#38B000"][index % 4],
          },
          itemStyle: {
            color: d.color || ["#3E92CC", "#F77F00", "#D62828", "#38B000"][index % 4],
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: d.color
                  ? d.color + "30"
                  : ["#3E92CC30", "#F77F0030", "#D6282830", "#38B00030"][index % 4],
              },
              {
                offset: 1,
                color: "rgba(255,255,255,0)",
              },
            ]),
          },
        })),
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
      chartInstance.current = null;
    };
  }, [data, xAxisData, title, yAxisName, showLegend]);

  return <div ref={chartRef} style={{ height }} />;
});

export default LineChart;
