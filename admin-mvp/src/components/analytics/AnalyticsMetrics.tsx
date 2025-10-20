"use client";
import React from "react";
import { Users, Building, Calendar, TrendingUp, Eye, Clock, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { useAllAnalytics } from "@/hooks/useAnalytics";

interface AnalyticsMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
}

const AnalyticsMetrics: React.FC = () => {
  const { platformStats, bookingAnalytics, isLoading, error } = useAllAnalytics();

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number): string => {
    if (previous === 0) return "0%";
    const growth = ((current - previous) / previous) * 100;
    return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  // Determine change type based on growth
  const getChangeType = (growth: string): "increase" | "decrease" => {
    return growth.startsWith('+') || growth === "0%" ? "increase" : "decrease";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 animate-pulse"></div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !platformStats.data) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-red-500">Failed to load analytics data</p>
      </div>
    );
  }

  // Safe data access with fallbacks
  const safeData = {
    users: {
      total: platformStats.data?.users?.total || 0,
      new: platformStats.data?.users?.new || 0,
    },
    spaces: {
      active: platformStats.data?.spaces?.active || 0,
    },
    bookings: {
      total: platformStats.data?.bookings?.total || 0,
    },
    revenue: {
      growth: platformStats.data?.revenue?.growth || 0,
    }
  };

  const analyticsMetrics: AnalyticsMetric[] = [
    {
      id: "1",
      title: "Total Users",
      value: formatNumber(safeData.users.total),
      change: calculateGrowth(safeData.users.total, safeData.users.total - safeData.users.new),
      changeType: getChangeType(calculateGrowth(safeData.users.total, safeData.users.total - safeData.users.new)),
      icon: <Users className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "2",
      title: "Active Spaces",
      value: formatNumber(safeData.spaces.active),
      change: calculateGrowth(safeData.spaces.active, safeData.spaces.active),
      changeType: "increase",
      icon: <Building className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "3",
      title: "Total Bookings",
      value: formatNumber(safeData.bookings.total),
      change: calculateGrowth(safeData.bookings.total, safeData.bookings.total - (bookingAnalytics.data?.completedBookings || 0)),
      changeType: getChangeType(calculateGrowth(safeData.bookings.total, safeData.bookings.total - (bookingAnalytics.data?.completedBookings || 0))),
      icon: <Calendar className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "4",
      title: "Platform Growth",
      change: `${safeData.revenue.growth.toFixed(1)}%`,
      value: `${safeData.revenue.growth.toFixed(1)}%`,
      changeType: safeData.revenue.growth >= 0 ? "increase" : "decrease",
      icon: <TrendingUp className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "5",
      title: "Page Views",
      value: "456.2K",
      change: "+8.7%",
      changeType: "increase",
      icon: <Eye className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "6",
      title: "Avg Session Time",
      value: "12m 34s",
      change: "-2.1%",
      changeType: "decrease",
      icon: <Clock className="text-gray-800 size-6 dark:text-white/90" />
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {analyticsMetrics.map((metric) => (
        <div
          key={metric.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {metric.icon}
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value}
              </h4>
            </div>
            <Badge color={metric.changeType === "increase" ? "success" : "error"}>
              {metric.changeType === "increase" ? (
                <ArrowUpIcon className="w-3 h-3" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-red-500" />
              )}
              {metric.change}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsMetrics;