"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Users, MapPin, Shield } from "lucide-react";
import { useUserAnalytics } from "@/hooks/useAnalytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const UserInsights: React.FC = () => {
  const { data: userAnalytics, isLoading, isError } = useUserAnalytics();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (isError || !userAnalytics) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-red-500">Failed to load user insights data</p>
      </div>
    );
  }

  // Since we don't have detailed demographics data in our API response,
  // we'll use mock data for now but structure it to be easily replaceable
  // when the API provides this data
  const userDemographics = {
    ageGroups: {
      series: [25, 35, 20, 15, 5],
      labels: ["18-25", "26-35", "36-45", "46-55", "55+"]
    },
    deviceTypes: {
      series: [65, 30, 5],
      labels: ["Mobile", "Desktop", "Tablet"]
    }
  };

  // Mock data for top cities - in a real implementation, this would come from the API
  const topCities = [
    { city: "Mumbai", users: 3247, percentage: 25.3 },
    { city: "Delhi", users: 2891, percentage: 22.5 },
    { city: "Bangalore", users: 2156, percentage: 16.8 },
    { city: "Pune", users: 1834, percentage: 14.3 },
    { city: "Hyderabad", users: 1289, percentage: 10.0 },
    { city: "Others", users: 1430, percentage: 11.1 }
  ];

  // Use available data from the API for user behavior metrics
  const userBehavior = [
    {
      metric: "Total Users",
      value: (userAnalytics.totalUsers || 0).toString(),
      icon: <Users className="w-4 h-4" />
    },
    {
      metric: "Active Users",
      value: (userAnalytics.activeUsers || 0).toString(),
      icon: <Users className="w-4 h-4" />
    },
    {
      metric: "New Users",
      value: (userAnalytics.newUsers || 0).toString(),
      icon: <Users className="w-4 h-4" />
    },
    {
      metric: "Admin Users",
      value: (userAnalytics.usersByRole?.admin || 0).toString(),
      icon: <Shield className="w-4 h-4" />
    }
  ];

  const pieChartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      height: 200,
    },
    colors: ["#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FECACA"],
    labels: userDemographics.ageGroups.labels,
    legend: {
      position: "bottom",
      fontSize: "12px",
      labels: {
        colors: "#64748B",
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "60%",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value}%`,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          User Insights
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Demographics and behavior analysis
        </p>
      </div>

      {/* Age Demographics Chart */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Age Demographics
        </h4>
        <div className="h-48">
          <ReactApexChart
            options={pieChartOptions}
            series={userDemographics.ageGroups.series}
            type="donut"
            height={180}
          />
        </div>
      </div>

      {/* Top Cities */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Top Cities
        </h4>
        <div className="space-y-2">
          {topCities.map((city, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {city.city}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {city.users.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">
                  ({city.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Behavior */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          User Metrics
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {userBehavior.map((behavior, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-100 p-3 dark:border-gray-700"
            >
              <div className="flex items-center space-x-2">
                <div className="text-gray-600 dark:text-gray-400">
                  {behavior.icon}
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {behavior.metric}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {behavior.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserInsights;