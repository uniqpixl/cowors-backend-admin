"use client";
import React from "react";
import { UserIcon, BoxIcon, CalenderIcon, DollarLineIcon } from "@/icons";
import Badge from "../ui/badge/Badge";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";

interface KPIMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
}

const KPISnapshot: React.FC = () => {
  const { data, isLoading, error } = useAdminDashboard();

  // Format number with commas
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${formatNumber(amount)}`;
  };

  // Calculate growth percentages from monthly data
  const calculateGrowth = (current: number, monthly: number): number => {
    if (current === 0) return 0;
    return Math.round((monthly / current) * 100);
  };

  // Generate KPI metrics from real data
  const kpiMetrics: KPIMetric[] = data?.kpis ? [
    {
      id: "1",
      title: "Total Users",
      value: formatNumber(data.kpis.totalUsers),
      change: `+${formatNumber(data.kpis.newUsersThisMonth)} this month`,
      changeType: data.kpis.newUsersThisMonth >= 0 ? "increase" : "decrease",
      icon: <UserIcon className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "2",
      title: "Total Spaces",
      value: formatNumber(data.kpis.totalSpaces),
      change: `${formatNumber(data.kpis.totalPartners)} partners`,
      changeType: "increase",
      icon: <BoxIcon className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "3",
      title: "Total Bookings",
      value: formatNumber(data.kpis.totalBookings),
      change: `+${formatNumber(data.kpis.bookingsThisMonth)} this month`,
      changeType: data.kpis.bookingsThisMonth >= 0 ? "increase" : "decrease",
      icon: <CalenderIcon className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "4",
      title: "Total Revenue",
      value: formatCurrency(data.kpis.totalRevenue),
      change: `+${formatCurrency(data.kpis.revenueThisMonth)} this month`,
      changeType: data.kpis.revenueThisMonth >= 0 ? "increase" : "decrease",
      icon: <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="w-12 h-12 bg-gray-300 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5">
              <div className="h-4 bg-gray-300 rounded dark:bg-gray-700 w-24 mb-2"></div>
              <div className="h-6 bg-gray-300 rounded dark:bg-gray-700 w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/10 md:p-6">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-red-700 dark:text-red-300 text-sm">
          {(error as Error).message || "Failed to load dashboard data. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Show KPI cards if we have data */}
      {kpiMetrics.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {kpiMetrics.map((metric) => (
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
                    <ArrowUpIcon />
                  ) : (
                    <ArrowDownIcon className="text-error-500" />
                  )}
                  {metric.change}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/10 md:p-6">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">No Data Available</h3>
          <p className="text-red-700 dark:text-red-300 text-sm">
            Unable to load dashboard data. Please check the connection and try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default KPISnapshot;