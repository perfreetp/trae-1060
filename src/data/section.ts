import type { DownstreamSection } from "../types";

export const downstreamSections: DownstreamSection[] = [
  {
    id: "sec-001",
    name: "宜昌",
    lat: 30.69,
    lng: 111.28,
    baseLevel: 40.5,
    warningLevel: 52.0,
    dangerLevel: 55.0,
    influenceCoefficients: {
      "res-001": 0.0008,
      "res-002": 0.0005,
      "res-003": 0.0015,
      "res-004": 0.0012,
    },
  },
  {
    id: "sec-002",
    name: "沙市",
    lat: 30.31,
    lng: 112.24,
    baseLevel: 38.2,
    warningLevel: 43.0,
    dangerLevel: 45.0,
    influenceCoefficients: {
      "res-001": 0.0012,
      "res-002": 0.0008,
      "res-003": 0.0020,
      "res-004": 0.0018,
    },
  },
  {
    id: "sec-003",
    name: "城陵矶",
    lat: 29.37,
    lng: 113.15,
    baseLevel: 26.8,
    warningLevel: 32.5,
    dangerLevel: 34.5,
    influenceCoefficients: {
      "res-001": 0.0015,
      "res-002": 0.0010,
      "res-003": 0.0025,
      "res-004": 0.0022,
    },
  },
  {
    id: "sec-004",
    name: "汉口",
    lat: 30.58,
    lng: 114.28,
    baseLevel: 20.5,
    warningLevel: 27.5,
    dangerLevel: 29.7,
    influenceCoefficients: {
      "res-001": 0.0010,
      "res-002": 0.0008,
      "res-003": 0.0018,
      "res-004": 0.0016,
    },
  },
];
