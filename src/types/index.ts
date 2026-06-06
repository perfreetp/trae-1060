export interface RainfallTimeRangeData {
  totalRain: number;
  maxIntensity: number;
}

export interface RainfallStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentRain: number;
  hourlyRain: number[];
  dailyRain: number;
  threshold: number;
  isAlert: boolean;
  alertLevel: "normal" | "warning" | "danger";
  timeSeries?: number[];
  timeRangeData?: RainfallTimeRangeData;
}

export interface RiverTimeRangeData {
  maxLevel: number;
  avgLevel: number;
}

export interface RiverStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentLevel: number;
  warningLevel: number;
  dangerLevel: number;
  trend: "up" | "down" | "stable";
  hourlyLevel: number[];
  updateTime: string;
  timeSeries?: number[];
  timeRangeData?: RiverTimeRangeData;
}

export interface DischargePoint {
  opening: number;
  discharge: number;
}

export interface StoragePoint {
  level: number;
  storage: number;
}

export interface ReservoirTimeRangeData {
  avgStorage: number;
  maxLevel: number;
}

export interface Reservoir {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentLevel: number;
  normalLevel: number;
  floodLimitLevel: number;
  maxLevel: number;
  currentStorage: number;
  totalCapacity: number;
  inflow: number;
  outflow: number;
  dischargeCapacity: DischargePoint[];
  storageCurve: StoragePoint[];
  timeSeries?: number[];
  timeRangeData?: ReservoirTimeRangeData;
}

export interface Forecast {
  id: string;
  reservoirId: string;
  hours: number;
  inflowData: number[];
  createTime: string;
  creator: string;
}

export interface ReservoirOperation {
  reservoirId: string;
  reservoirName: string;
  targetLevel: number;
  discharge: number;
  startTime: string;
  endTime: string;
}

export interface RiskPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  level: "high" | "medium" | "low";
  description: string;
}

export interface SimulationResult {
  maxLevel: number;
  totalDischarge: number;
  riskLevel: string;
}

export interface Scheme {
  id: string;
  name: string;
  createTime: string;
  creator: string;
  status: "draft" | "approved" | "executed";
  reservoirOperations: ReservoirOperation[];
  riskPoints: RiskPoint[];
  simulationResult: SimulationResult;
}

export interface Command {
  id: string;
  title: string;
  content: string;
  createTime: string;
  creator: string;
  executor: string;
  status: "pending" | "executing" | "completed" | "cancelled";
  executeTime?: string;
  completeTime?: string;
  feedback?: string;
  smsSent: boolean;
  schemeId?: string;
}

export interface DispatchLog {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
}

export interface HistoricalFlood {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  maxRainfall: number;
  maxLevel: number;
  affectedReservoirs: string[];
}

export interface ReviewScore {
  id: string;
  floodId: string;
  dimensions: {
    forecastAccuracy: number;
    schemeRationality: number;
    executionTimeliness: number;
    disasterReduction: number;
    collaboration: number;
  };
  totalScore: number;
  reviewer: string;
  reviewTime: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  level: "critical" | "major" | "minor";
  status: "open" | "processing" | "closed";
  assignee: string;
  createTime: string;
  resolveTime?: string;
  resolution?: string;
}

export interface ShiftHandover {
  id: string;
  shiftType: "day" | "night";
  handoverTime: string;
  outgoingPerson: string;
  incomingPerson: string;
  keyPoints: string;
  pendingTasks: string;
  remarks: string;
  status: "pending_confirm" | "confirmed";
  confirmTime?: string;
}

export interface AlertItem {
  id: string;
  level: "danger" | "warning" | "info";
  title: string;
  content: string;
  time: string;
  source: string;
}

export type TimeRange = "6h" | "24h" | "3d" | "7d";

export interface SmsRecord {
  id: string;
  commandId: string;
  receiver: string;
  receiverPhone: string;
  content: string;
  sendTime: string;
  status: "sent" | "failed" | "sending";
}

export interface TimeSeriesDataPoint {
  time: string;
  value: number;
}

export interface SectionForecast {
  id: string;
  name: string;
  predictedLevel: number;
  warningLevel: number;
  riskLevel: "high" | "medium" | "low";
  timeSeries: TimeSeriesDataPoint[];
}

export interface CommandFormData {
  title: string;
  content: string;
  reservoirIds: string[];
  schemeId?: string;
  receivers: string[];
  deadline: string;
}

export interface IssueFormData {
  title: string;
  description: string;
  level: "critical" | "major" | "minor";
  assignee: string;
}

export interface ShiftHandoverFormData {
  shiftType: "day" | "night";
  incomingPerson: string;
  waterSummary: string;
  pendingCommands: string;
  riskPoints: string;
  notes: string;
}

export interface DownstreamSection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  baseLevel: number;
  warningLevel: number;
  dangerLevel: number;
  influenceCoefficients: Record<string, number>;
}

export interface ReservoirSimulationState {
  reservoirId: string;
  targetLevel: number;
  discharge: number;
  startTime: string;
  endTime: string;
}
