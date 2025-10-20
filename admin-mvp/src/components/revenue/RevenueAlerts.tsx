"use client";
import React from "react";
import { TrendingUp, TrendingDown, Target, Clock, Loader2 } from "lucide-react";
import { useRevenueBreakdown } from "@/hooks/useAnalytics";

interface Alert {
  id: string;
  type: "warning" | "success" | "info" | "error";
  title: string;
  message: string;
  icon: React.ReactNode;
  timestamp: string;
}

const RevenueAlerts: React.FC = () => {
  const { data: alertsData, isLoading, error } = useRevenueBreakdown();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading Revenue Alerts...
          </h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-400">Loading...</h4>
                  <p className="text-sm text-gray-400 mt-1">Loading alert details...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
            Revenue Alerts
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load revenue alerts
          </p>
        </div>
      </div>
    );
  }

  const alerts: Alert[] = alertsData?.alerts || [];

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          icon: "text-green-600 dark:text-green-400",
          title: "text-green-800 dark:text-green-300"
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          icon: "text-yellow-600 dark:text-yellow-400",
          title: "text-yellow-800 dark:text-yellow-300"
        };
      case "error":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          icon: "text-red-600 dark:text-red-400",
          title: "text-red-800 dark:text-red-300"
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          title: "text-blue-800 dark:text-blue-300"
        };
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
          Revenue Alerts
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Important notifications and insights about revenue performance
        </p>
      </div>
      
      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const styles = getAlertStyles(alert.type);
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 ${styles.icon}`}>
                    {alert.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${styles.title}`}>
                      {alert.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {alert.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Target className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No revenue alerts at this time
            </p>
          </div>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
          Quick Insights
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">{alertsData?.insights?.revenueGrowth || '+0%'}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active Revenue Streams</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{alertsData?.insights?.activeStreams || '0'}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Pending Collections</span>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">{alertsData?.insights?.pendingCollections || '₹0'}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Next Target</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{alertsData?.insights?.nextTarget || '₹0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAlerts;