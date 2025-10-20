"use client";
import React from "react";
import LineChartOne from "../charts/line/LineChartOne";

const RevenueChart: React.FC = () => {

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
          Revenue Trends
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Monthly revenue and commission performance over the year
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹6,20,000</p>
          <p className="text-xs text-green-600 dark:text-green-400">+18.2% from last month</p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commission</p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">₹93,000</p>
            <p className="text-xs text-brand-600 dark:text-brand-400">15% avg commission rate</p>
        </div>
      </div>
      
      <div className="h-80">
        <LineChartOne />
      </div>
    </div>
  );
};

export default RevenueChart;