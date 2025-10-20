import React from "react";
// import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";
import dynamic from "next/dynamic";

const VectorMap = dynamic(
  () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
  { ssr: false }
);

// Define the component props
interface CountryMapProps {
  mapColor?: string;
}

type MarkerStyle = {
  initial: {
    fill: string;
    r: number; // Radius for markers
  };
};

type Marker = {
  latLng: [number, number];
  name: string;
  style?: {
    fill: string;
    borderWidth: number;
    borderColor: string;
    stroke?: string;
    strokeOpacity?: number;
  };
};

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"
      markerStyle={
        {
          initial: {
            fill: "var(--chart-primary)",
            r: 4, // Custom radius for markers
          }, // Type assertion to bypass strict CSS property checks
        } as MarkerStyle
      }
      markersSelectable={true}
      markers={
        [
          {
            latLng: [37.2580397, -104.657039],
            name: "United States",
            style: {
              fill: "var(--chart-primary)",
              borderWidth: 1,
              borderColor: "var(--color-white)",
              stroke: "var(--color-gray-700)",
            },
          },
          {
            latLng: [20.7504374, 73.7276105],
            name: "India",
            style: { fill: "var(--chart-primary)", borderWidth: 1, borderColor: "var(--color-white)" },
          },
          {
            latLng: [53.613, -11.6368],
            name: "United Kingdom",
            style: { fill: "var(--chart-primary)", borderWidth: 1, borderColor: "var(--color-white)" },
          },
          {
            latLng: [-25.0304388, 115.2092761],
            name: "Sweden",
            style: {
              fill: "var(--chart-primary)",
              borderWidth: 1,
              borderColor: "var(--color-white)",
              strokeOpacity: 0,
            },
          },
        ] as Marker[]
      }
      zoomOnScroll={false}
      zoomMax={12}
      zoomMin={1}
      zoomAnimate={true}
      zoomStep={1.5}
      regionStyle={{
        initial: {
          fill: mapColor || "var(--color-gray-300)",
          fillOpacity: 1,
          fontFamily: "Outfit",
          stroke: "none",
          strokeWidth: 0,
          strokeOpacity: 0,
        },
        hover: {
          fillOpacity: 0.7,
          cursor: "pointer",
          fill: "var(--chart-primary)",
          stroke: "none",
        },
        selected: {
          fill: "var(--chart-primary)",
        },
        selectedHover: {},
      }}
      regionLabelStyle={{
        initial: {
          fill: "var(--color-gray-800)",
          fontWeight: 500,
          fontSize: "13px",
          stroke: "none",
        },
        hover: {},
        selected: {},
        selectedHover: {},
      }}
    />
  );
};

export default CountryMap;
