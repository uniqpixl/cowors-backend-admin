"use client";
import React from "react";
import AnalyticsMetrics from "./AnalyticsMetrics";
import AnalyticsCharts from "./AnalyticsCharts";
import UserInsights from "./UserInsights";
import PerformanceMetrics from "./PerformanceMetrics";

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Key Analytics Metrics */}
      <AnalyticsMetrics />
      
      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnalyticsCharts />
        <UserInsights />
      </div>
      
      {/* Performance Metrics */}
      <PerformanceMetrics />
    </div>
  );
};

export default AnalyticsDashboard;