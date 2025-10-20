"use client";
import React from "react";
import { Server, Zap, Shield, Globe, Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { usePlatformStats } from "@/hooks/useAnalytics";

interface PerformanceMetric {
  id: string;
  category: string;
  metrics: {
    name: string;
    value: string;
    status: "good" | "warning" | "error";
    icon: React.ReactNode;
  }[];
}

const PerformanceMetrics: React.FC = () => {
  const { data: platformStats, isLoading, isError } = usePlatformStats();

  const getStatusBadge = (status: "good" | "warning" | "error") => {
    switch (status) {
      case "good":
        return <Badge color="success">Good</Badge>;
      case "warning":
        return <Badge color="warning">Warning</Badge>;
      case "error":
        return <Badge color="error">Error</Badge>;
      default:
        return <Badge color="light">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: "good" | "warning" | "error") => {
    switch (status) {
      case "good":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3].map((item) => (
                <div key={item}>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((metric) => (
                      <div key={metric} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-6 w-12 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4">
              <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !platformStats) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-red-500">Failed to load performance metrics</p>
          </div>
        </div>
      </div>
    );
  }

  const performanceData: PerformanceMetric[] = [
    {
      id: "1",
      category: "System Performance",
      metrics: [
        {
          name: "Server Uptime",
          value: "99.9%",
          status: "good",
          icon: <Server className="w-4 h-4" />
        },
        {
          name: "Response Time",
          value: "245ms",
          status: "good",
          icon: <Zap className="w-4 h-4" />
        },
        {
          name: "Error Rate",
          value: "0.02%",
          status: "good",
          icon: <AlertTriangle className="w-4 h-4" />
        },
        {
          name: "API Calls",
          value: "1.2M",
          status: "good",
          icon: <Globe className="w-4 h-4" />
        }
      ]
    },
    {
      id: "2",
      category: "User Experience",
      metrics: [
        {
          name: "Page Load Time",
          value: "1.8s",
          status: "warning",
          icon: <Clock className="w-4 h-4" />
        },
        {
          name: "Bounce Rate",
          value: "32%",
          status: "good",
          icon: <TrendingUp className="w-4 h-4" />
        },
        {
          name: "Conversion Rate",
          value: "4.2%",
          status: "good",
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          name: "User Satisfaction",
          value: "4.6/5",
          status: "good",
          icon: <CheckCircle className="w-4 h-4" />
        }
      ]
    },
    {
      id: "3",
      category: "Security & Compliance",
      metrics: [
        {
          name: "Security Score",
          value: "A+",
          status: "good",
          icon: <Shield className="w-4 h-4" />
        },
        {
          name: "SSL Certificate",
          value: "Valid",
          status: "good",
          icon: <Shield className="w-4 h-4" />
        },
        {
          name: "Data Backup",
          value: "Daily",
          status: "good",
          icon: <Server className="w-4 h-4" />
        },
        {
          name: "Compliance",
          value: "100%",
          status: "good",
          icon: <CheckCircle className="w-4 h-4" />
        }
      ]
    }
  ];

  const recentAlerts = [
    {
      id: "1",
      type: "info",
      message: "Database backup completed successfully",
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      type: "warning",
      message: "Page load time increased by 15% in the last hour",
      timestamp: "4 hours ago"
    },
    {
      id: "3",
      type: "success",
      message: "Security scan completed - no vulnerabilities found",
      timestamp: "6 hours ago"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Performance Metrics */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Metrics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              System health and performance indicators
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {performanceData.map((category) => (
              <div key={category.id}>
                <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {category.category}
                </h4>
                <div className="space-y-3">
                  {category.metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={getStatusColor(metric.status)}>
                          {metric.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {metric.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {metric.value}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(metric.status)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Alerts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recent system notifications
            </p>
          </div>

          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-gray-100 p-3 dark:border-gray-700"
              >
                <div className="flex items-start space-x-2">
                  <div className="mt-1">
                    {alert.type === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {alert.type === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                    {alert.type === "info" && (
                      <Globe className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {alert.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 w-full text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;