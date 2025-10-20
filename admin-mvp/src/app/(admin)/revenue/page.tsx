import { Metadata } from "next";
import RevenueDashboard from "@/components/revenue/RevenueDashboard";

export const metadata: Metadata = {
  title: "Revenue Analytics | Admin Dashboard",
  description: "Comprehensive revenue analytics, charts, and performance metrics",
};

const RevenuePage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Revenue Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor revenue performance, trends, and detailed analytics across all revenue streams
          </p>
        </div>
        
        <RevenueDashboard />
      </div>
    </>
  );
};

export default RevenuePage;