import { Metadata } from "next";
import TDSDashboard from "@/components/taxes/TDSDashboard";

export const metadata: Metadata = {
  title: "TDS Management | Admin Dashboard",
  description: "Tax Deducted at Source management and ledger overview",
};

const TDSPage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            TDS Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor Tax Deducted at Source, compliance tracking, and ledger overview
          </p>
        </div>
        
        <TDSDashboard />
      </div>
    </>
  );
};

export default TDSPage;