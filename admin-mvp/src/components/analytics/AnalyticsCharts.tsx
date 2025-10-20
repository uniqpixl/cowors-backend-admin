"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { useBookingAnalytics, useUserAnalytics, useRevenueAnalytics } from "@/hooks/useAnalytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const AnalyticsCharts: React.FC = () => {
  const [chartPeriod, setChartPeriod] = useState("monthly");
  const [chartType, setChartType] = useState("users");

  // Use our custom hooks to fetch data
  const { data: bookingData, isLoading: bookingLoading } = useBookingAnalytics(chartPeriod);
  const { data: userData, isLoading: userLoading } = useUserAnalytics(chartPeriod);
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(chartPeriod);

  const isLoading = bookingLoading || userLoading || revenueLoading;

  const getChartData = () => {
    switch (chartType) {
      case "users":
        return userData?.userGrowthByTimeRange?.map(item => item.count) || [];
      case "bookings":
        return bookingData?.bookingsByTimeRange?.map(item => item.count) || [];
      case "revenue":
        return revenueData?.revenueByTimeRange?.map(item => item.amount) || [];
      default:
        return userData?.userGrowthByTimeRange?.map(item => item.count) || [];
    }
  };

  const getChartCategories = () => {
    switch (chartType) {
      case "users":
        return userData?.userGrowthByTimeRange?.map(item => item.date) || [];
      case "bookings":
        return bookingData?.bookingsByTimeRange?.map(item => item.date) || [];
      case "revenue":
        return revenueData?.revenueByTimeRange?.map(item => item.date) || [];
      default:
        return userData?.userGrowthByTimeRange?.map(item => item.date) || [];
    }
  };

  const getChartTitle = () => {
    switch (chartType) {
      case "users":
        return "User Growth";
      case "bookings":
        return "Booking Trends";
      case "revenue":
        return "Revenue Analytics";
      default:
        return "User Growth";
    }
  };

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ["#DC2626"],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: "#DC2626",
            opacity: 0.7
          },
          {
            offset: 100,
            color: "#DC2626",
            opacity: 0.1
          }
        ]
      },
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    xaxis: {
      categories: getChartCategories(),
      labels: {
        style: {
          colors: "#64748B",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748B",
        },
        formatter: (value) => {
          if (chartType === "revenue") {
            return `₹${(value / 1000).toFixed(0)}K`;
          }
          return value.toLocaleString();
        },
      },
    },
    grid: {
      borderColor: "#E2E8F0",
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value) => {
          if (chartType === "revenue") {
            return `₹${value.toLocaleString()}`;
          }
          return value.toLocaleString();
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    {
      name: getChartTitle(),
      data: getChartData(),
    },
  ];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getChartTitle()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Platform performance metrics over time
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="users">Users</option>
              <option value="bookings">Bookings</option>
              <option value="revenue">Revenue</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="h-80">
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="area"
          height={320}
        />
      </div>
    </div>
  );
};

export default AnalyticsCharts;