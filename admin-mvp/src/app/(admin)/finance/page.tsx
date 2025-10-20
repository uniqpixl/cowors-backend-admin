import { Metadata } from "next";
import FinancialDashboard from "@/components/finance/FinancialDashboard";

export const metadata: Metadata = {
  title: "Finance Overview | Admin Dashboard",
  description: "Comprehensive financial overview and analytics dashboard",
};

const FinancePage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Finance Overview
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor platform financial performance, transactions, and revenue analytics
          </p>
        </div>
        
        <FinancialDashboard />
      </div>
    </>
  );
};

export default FinancePage;