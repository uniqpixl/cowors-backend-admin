"use client";
import React from "react";

import Alert from "../ui/alert/Alert";

interface FinancialAlert {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  action?: string;
}

const FinancialAlerts: React.FC = () => {
  const alerts: FinancialAlert[] = [
    {
      id: "1",
      type: "success",
      title: "Revenue Target Achieved",
      message: "Monthly revenue target of ₹5,00,000 has been exceeded by 24.5%",
      action: "View Details"
    },
    {
      id: "2",
      type: "warning",
      title: "Pending Payouts Alert",
      message: "₹1,12,950 in payouts are pending and due within 3 days",
      action: "Process Payouts"
    },
    {
      id: "3",
      type: "info",
      title: "Commission Rate Update",
      message: "New commission structure will be effective from next month",
      action: "Review Changes"
    }
  ];



  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-3">Financial Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.type}
            title={alert.title}
            message={alert.message}
            showLink={!!alert.action}
            linkText={alert.action}
          />
        ))}
      </div>
    </div>
  );
};

export default FinancialAlerts;