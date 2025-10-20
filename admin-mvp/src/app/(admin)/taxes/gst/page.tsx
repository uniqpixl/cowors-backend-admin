import { Metadata } from "next";
import GSTDashboard from "@/components/taxes/GSTDashboard";

export const metadata: Metadata = {
  title: "GST on Commission | Admin Dashboard",
  description: "GST on Commission management and ledger overview",
};

const GSTPage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            GST on Commission
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor GST collections, compliance status, and commission-based tax ledger
          </p>
        </div>
        
        <GSTDashboard />
      </div>
    </>
  );
};

export default GSTPage;