"use client";
import React from "react";
import FinancialMetrics from "./FinancialMetrics";
import RevenueChart from "./RevenueChart";
import PayoutOverview from "./PayoutOverview";
import FinancialAlerts from "./FinancialAlerts";

const FinancialDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <FinancialMetrics />
      
      {/* Revenue Chart */}
      <div className="grid grid-cols-1 gap-6">
        <RevenueChart />
      </div>
      
      {/* Payout Overview and Financial Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PayoutOverview />
        </div>
        <div>
          <FinancialAlerts />
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;