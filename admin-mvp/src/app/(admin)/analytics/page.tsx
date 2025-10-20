import { Metadata } from "next";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Platform Analytics | Admin Dashboard",
  description: "Comprehensive platform analytics, user insights, and performance metrics",
};

const AnalyticsPage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive insights into platform performance, user behavior, and business metrics
          </p>
        </div>
        
        <AnalyticsDashboard />
      </div>
    </>
  );
};

export default AnalyticsPage;