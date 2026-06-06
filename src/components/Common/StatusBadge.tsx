import { getStatusColor, getStatusText } from "../../utils/format";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}
