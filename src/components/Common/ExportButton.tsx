import { useState } from "react";
import { Download, Image, FileText, ChevronDown } from "lucide-react";
import type { ChartRef } from "../Charts/LineChart";
import { exportChartAsImage, exportTableAsCSV, timeRangeLabels } from "../../utils/export";

interface ExportButtonProps {
  chartRef?: React.RefObject<ChartRef> | null;
  pageName: string;
  entityName: string;
  timeRange: string;
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
}

export default function ExportButton({
  chartRef,
  pageName,
  entityName,
  timeRange,
  tableData,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  const handleExportImage = () => {
    if (chartRef?.current) {
      exportChartAsImage(chartRef.current, pageName, entityName, timeRangeLabels[timeRange] || timeRange);
    }
    setOpen(false);
  };

  const handleExportCSV = () => {
    if (tableData) {
      exportTableAsCSV(
        tableData.headers,
        tableData.rows,
        pageName,
        entityName,
        timeRangeLabels[timeRange] || timeRange
      );
    }
    setOpen(false);
  };

  const hasOptions = chartRef || tableData;
  if (!hasOptions) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-primary flex items-center gap-2 text-sm py-1.5 px-3"
      >
        <Download className="w-4 h-4" />
        导出
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]">
          {chartRef && (
            <button
              onClick={handleExportImage}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <Image className="w-4 h-4 text-gray-500" />
              导出图片
            </button>
          )}
          {tableData && (
            <button
              onClick={handleExportCSV}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              导出表格
            </button>
          )}
        </div>
      )}
    </div>
  );
}
