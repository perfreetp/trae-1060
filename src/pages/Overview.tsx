import { CloudRain, Waves, Droplets, AlertTriangle } from "lucide-react";
import DataCard from "../components/Common/DataCard";
import AlertPanel from "../components/Common/AlertPanel";
import BasinMap from "../components/Map/BasinMap";
import LineChart from "../components/Charts/LineChart";
import { useAppStore } from "../store/useAppStore";
import { reservoirs } from "../data/reservoir";
import { rainfallStations } from "../data/rainfall";
import { riverStations } from "../data/river";
import { formatNumber } from "../utils/format";

export default function Overview() {
  const { alerts } = useAppStore();

  const totalRainfall = rainfallStations.reduce(
    (sum, s) => sum + s.dailyRain,
    0
  );
  const avgWaterLevel =
    riverStations.reduce((sum, s) => sum + s.currentLevel, 0) /
    riverStations.length;
  const totalStorage = reservoirs.reduce(
    (sum, r) => sum + r.currentStorage,
    0
  );
  const alertCount = alerts.filter((a) => a.level !== "info").length;

  const hours = ["8h", "10h", "12h", "14h", "16h"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">流域总览</h2>
        <span className="text-sm text-gray-500">
          数据更新时间: {new Date().toLocaleString("zh-CN")}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <DataCard
          title="累计降雨量"
          value={formatNumber(totalRainfall / rainfallStations.length, 1)}
          unit="mm"
          icon={<CloudRain className="w-6 h-6" />}
          trend="up"
          trendValue="较昨日 +12%"
        />
        <DataCard
          title="平均水位"
          value={formatNumber(avgWaterLevel, 1)}
          unit="m"
          icon={<Waves className="w-6 h-6" />}
          trend="up"
          trendValue="上涨 0.3m"
        />
        <DataCard
          title="总库容"
          value={formatNumber(totalStorage / 10000, 2)}
          unit="亿m³"
          icon={<Droplets className="w-6 h-6" />}
          trend="stable"
          trendValue="占总库容 68%"
        />
        <DataCard
          title="超警站点"
          value={alertCount}
          unit="个"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="text-alert-danger"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="data-card h-full">
            <h3 className="font-semibold text-gray-800 mb-4">流域分布图</h3>
            <BasinMap
              reservoirs={reservoirs}
              rainfallStations={rainfallStations}
              riverStations={riverStations}
              height="450px"
            />
          </div>
        </div>
        <div className="space-y-6">
          <AlertPanel alerts={alerts} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="data-card">
          <LineChart
            data={[
              {
                name: "流域平均降雨",
                values: rainfallStations.map((s) => s.dailyRain / 10),
                color: "#3E92CC",
              },
            ]}
            xAxisData={hours}
            title="降雨趋势"
            yAxisName="mm"
            height={250}
            showLegend={false}
          />
        </div>
        <div className="data-card">
          <LineChart
            data={[
              {
                name: "宜昌站",
                values: riverStations[0].hourlyLevel,
                color: "#F77F00",
              },
              {
                name: "沙市站",
                values: riverStations[1].hourlyLevel,
                color: "#D62828",
              },
            ]}
            xAxisData={hours}
            title="关键站点水位趋势"
            yAxisName="m"
            height={250}
          />
        </div>
      </div>
    </div>
  );
}
