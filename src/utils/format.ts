export const formatNumber = (num: number, decimals = 1) => {
  return num.toFixed(decimals);
};

export const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN");
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    executing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
    draft: "bg-gray-100 text-gray-800",
    approved: "bg-green-100 text-green-800",
    executed: "bg-blue-100 text-blue-800",
    open: "bg-red-100 text-red-800",
    processing: "bg-yellow-100 text-yellow-800",
    closed: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待执行",
    executing: "执行中",
    completed: "已完成",
    cancelled: "已取消",
    draft: "草案",
    approved: "已审批",
    executed: "已执行",
    open: "待处理",
    processing: "处理中",
    closed: "已关闭",
  };
  return texts[status] || status;
};

export const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    danger: "bg-red-500",
    warning: "bg-orange-500",
    caution: "bg-yellow-500",
    info: "bg-blue-500",
    success: "bg-green-500",
    critical: "bg-red-500",
    major: "bg-orange-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
    low: "bg-blue-500",
  };
  return colors[level] || "bg-gray-500";
};

export const getTrendIcon = (trend: string) => {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
};

export const getTrendColor = (trend: string) => {
  if (trend === "up") return "text-red-500";
  if (trend === "down") return "text-green-500";
  return "text-gray-500";
};
