import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Reservoir, RainfallStation, RiverStation, RiskPoint } from "../../types";

interface BasinMapProps {
  reservoirs?: Reservoir[];
  rainfallStations?: RainfallStation[];
  riverStations?: RiverStation[];
  riskPoints?: RiskPoint[];
  height?: string | number;
  onReservoirClick?: (reservoir: Reservoir) => void;
}

export default function BasinMap({
  reservoirs = [],
  rainfallStations = [],
  riverStations = [],
  riskPoints = [],
  height = "500px",
  onReservoirClick,
}: BasinMapProps) {
  const heightStyle = typeof height === "number" ? `${height}px` : height;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [31.5, 111.5],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 19,
      }).addTo(mapInstance.current);

      reservoirs.forEach((res) => {
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:24px;height:24px;background:#3E92CC;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([res.lat, res.lng], { icon }).addTo(
          mapInstance.current!
        );
        
        const avgStorage = res.timeRangeData?.avgStorage ?? res.currentStorage;
        const avgStorageYi = (avgStorage / 10000).toFixed(2);
        
        marker.bindPopup(`
          <div style="padding:4px;">
            <strong style="color:#0A2463;">${res.name}</strong><br/>
            <span style="font-size:12px;color:#666;">当前水位: ${res.currentLevel}m</span><br/>
            <span style="font-size:12px;color:#666;">当前库容: ${res.currentStorage}万m³</span><br/>
            ${res.timeRangeData ? `<span style="font-size:12px;color:#0A2463;font-weight:500;">时段平均库容: ${avgStorageYi}亿m³</span>` : ""}
          </div>
        `);
        if (onReservoirClick) {
          marker.on("click", () => onReservoirClick(res));
        }
      });

      rainfallStations.forEach((station) => {
        const color =
          station.alertLevel === "danger"
            ? "#D62828"
            : station.alertLevel === "warning"
            ? "#F77F00"
            : "#38B000";
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([station.lat, station.lng], { icon }).addTo(
          mapInstance.current!
        );
        
        const totalRain = station.timeRangeData?.totalRain ?? station.dailyRain;
        
        marker.bindPopup(`
          <div style="padding:4px;">
            <strong>${station.name}</strong><br/>
            <span style="font-size:12px;">日降雨: ${station.dailyRain}mm</span><br/>
            ${station.timeRangeData ? `<span style="font-size:12px;color:#38B000;font-weight:500;">时段累计: ${totalRain}mm</span>` : ""}
          </div>
        `);
      });

      riverStations.forEach((station) => {
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:14px;height:14px;background:#0096C7;border:2px solid white;border-radius:2px;transform:rotate(45deg);box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([station.lat, station.lng], { icon }).addTo(
          mapInstance.current!
        );
        
        const maxLevel = station.timeRangeData?.maxLevel ?? station.currentLevel;
        
        marker.bindPopup(`
          <div style="padding:4px;">
            <strong>${station.name}</strong><br/>
            <span style="font-size:12px;">当前水位: ${station.currentLevel}m</span><br/>
            ${station.timeRangeData ? `<span style="font-size:12px;color:#0096C7;font-weight:500;">时段最高水位: ${maxLevel}m</span>` : ""}
          </div>
        `);
      });

      riskPoints.forEach((point) => {
        const color =
          point.level === "high"
            ? "#D62828"
            : point.level === "medium"
            ? "#F77F00"
            : "#FCBF49";
        L.circle([point.lat, point.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          radius: 5000,
          weight: 2,
        })
          .addTo(mapInstance.current!)
          .bindPopup(`
            <div style="padding:4px;">
              <strong style="color:${color};">${point.name}</strong><br/>
              <span style="font-size:12px;">${point.description}</span>
            </div>
          `);
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [reservoirs, rainfallStations, riverStations, riskPoints, onReservoirClick]);

  return <div ref={mapRef} style={{ height: heightStyle, width: "100%" }} />;
}
