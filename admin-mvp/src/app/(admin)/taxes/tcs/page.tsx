import { Metadata } from "next";
import TCSDashboard from "@/components/taxes/TCSDashboard";

export const metadata: Metadata = {
  title: "TCS Management | Admin Dashboard",
  description: "Tax Collected at Source management and deduction ledger overview",
};

const TCSPage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            TCS Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor Tax Collected at Source, deduction tracking, and compliance overview
          </p>
        </div>
        
        <TCSDashboard />
      </div>
    </>
  );
};

export default TCSPage;