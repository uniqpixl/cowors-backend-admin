"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { useReviewAnalytics } from "@/hooks/useReviews";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const ReviewsChart: React.FC = () => {
  const [chartPeriod, setChartPeriod] = useState("monthly");
  const { data: analytics, isLoading, error } = useReviewAnalytics();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reviews Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review trends and rating distribution
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reviews Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review trends and rating distribution
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <span>Failed to load analytics</span>
          </div>
        </div>
      </div>
    );
  }

  // Generate mock chart data based on analytics
  const reviewsData = {
    monthly: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      series: [
        {
          name: "Total Reviews",
          data: Array.from({ length: 12 }, (_, i) => Math.floor((analytics?.totalReviews || 0) / 12 * (0.8 + Math.random() * 0.4)))
        },
        {
          name: "Average Rating",
          data: Array.from({ length: 12 }, () => Number(((analytics?.averageRating || 4.5) + (Math.random() - 0.5) * 0.4).toFixed(1)))
        }
      ]
    },
    weekly: {
      categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
      series: [
        {
          name: "Total Reviews",
          data: Array.from({ length: 4 }, () => Math.floor((analytics?.totalReviews || 0) / 12))
        },
        {
          name: "Average Rating",
          data: Array.from({ length: 4 }, () => Number(((analytics?.averageRating || 4.5) + (Math.random() - 0.5) * 0.2).toFixed(1)))
        }
      ]
    }
  };

  const currentData = reviewsData[chartPeriod as keyof typeof reviewsData];

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ["#DC2626", "#EF4444"],
    stroke: {
      width: [3, 3],
      curve: "smooth",
    },
    xaxis: {
      categories: currentData.categories,
      labels: {
        style: {
          colors: "#64748B",
        },
      },
    },
    yaxis: [
      {
        title: {
          text: "Number of Reviews",
          style: {
            color: "#64748B",
          },
        },
        labels: {
          style: {
            colors: "#64748B",
          },
        },
      },
      {
        opposite: true,
        title: {
          text: "Average Rating",
          style: {
            color: "#64748B",
          },
        },
        labels: {
          style: {
            colors: "#64748B",
          },
        },
        min: 0,
        max: 5,
      },
    ],
    grid: {
      borderColor: "#E2E8F0",
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: {
        colors: "#64748B",
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const statsData = [
    {
      title: "5 Star Reviews",
      value: analytics?.reviewsByRating?.[5] || 0,
      percentage: analytics?.totalReviews ? `${((analytics.reviewsByRating?.[5] || 0) / analytics.totalReviews * 100).toFixed(1)}%` : "0%",
    },
    {
      title: "4 Star Reviews",
      value: analytics?.reviewsByRating?.[4] || 0,
      percentage: analytics?.totalReviews ? `${((analytics.reviewsByRating?.[4] || 0) / analytics.totalReviews * 100).toFixed(1)}%` : "0%",
    },
    {
      title: "3 Star Reviews",
      value: analytics?.reviewsByRating?.[3] || 0,
      percentage: analytics?.totalReviews ? `${((analytics.reviewsByRating?.[3] || 0) / analytics.totalReviews * 100).toFixed(1)}%` : "0%",
    },
    {
      title: "Below 3 Stars",
      value: (analytics?.reviewsByRating?.[1] || 0) + (analytics?.reviewsByRating?.[2] || 0),
      percentage: analytics?.totalReviews ? `${(((analytics.reviewsByRating?.[1] || 0) + (analytics.reviewsByRating?.[2] || 0)) / analytics.totalReviews * 100).toFixed(1)}%` : "0%",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reviews Analytics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review trends and rating distribution
          </p>
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

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stat.title}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              {stat.percentage}
            </div>
          </div>
        ))}
      </div>

      <div className="h-80">
        <ReactApexChart
          options={chartOptions}
          series={currentData.series}
          type="line"
          height={320}
        />
      </div>
    </div>
  );
};

export default ReviewsChart;