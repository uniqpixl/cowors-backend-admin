"use client";
import React from "react";
import OverviewCard from "./OverviewCard";
import TaxLedgerTable from "./TaxLedgerTable";
import { IndianRupee, TrendingUp, FileText, AlertCircle, Calendar, Users } from "lucide-react";
import { useGSTData } from "@/hooks/useTaxes";
import { Skeleton } from "@/components/ui/skeleton";

const GSTDashboard: React.FC = () => {
  const { data: gstData, isLoading, error } = useGSTData();

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    // Provide fallback data when API is not available
    const fallbackGstData = {
      metrics: [
        { id: 1, title: "Total GST Collected", value: "₹3,45,670", icon: <IndianRupee className="w-5 h-5" />, change: "+18.5%", changeType: "increase" as const, description: "vs last month" },
        { id: 2, title: "GST Rate", value: "18%", icon: <Calendar className="w-5 h-5" />, change: "0%", changeType: "neutral" as const, description: "standard rate" },
        { id: 3, title: "Transactions", value: "2,156", icon: <FileText className="w-5 h-5" />, change: "+89", changeType: "increase" as const, description: "vs last month" },
        { id: 4, title: "Pending Filing", value: "₹67,890", icon: <AlertCircle className="w-5 h-5" />, change: "-12.3%", changeType: "decrease" as const, description: "vs last month" },
        { id: 5, title: "Growth", value: "+15.7%", icon: <TrendingUp className="w-5 h-5" />, change: "+4.2%", changeType: "increase" as const, description: "vs last quarter" },
        { id: 6, title: "Affected Partners", value: "234", icon: <Users className="w-5 h-5" />, change: "+12", changeType: "increase" as const, description: "vs last month" }
      ],
      ledgerEntries: []
    };
    
    return (
      <div className="space-y-6">
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <AlertCircle className="inline w-4 h-4 mr-2" />
            GST API endpoint not available. Showing sample data for demonstration.
          </p>
        </div>
        
        {/* GST Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {fallbackGstData.metrics.map((metric: any) => (
            <OverviewCard key={metric.id} {...metric} />
          ))}
        </div>
        
        {/* GST Ledger Table */}
        <TaxLedgerTable 
          title="GST Collection Ledger" 
          data={fallbackGstData.ledgerEntries} 
          taxType="GST"
        />
        
        {/* GST Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">GST Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Generate GST Report</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Export monthly GST collection report</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">File GST Return</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Submit monthly GST return to authorities</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Reconcile GST</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Match GST records with partner payments</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use real data or fallback to empty arrays
  const gstMetrics = gstData?.metrics || [];
  const gstLedgerData = gstData?.ledgerEntries || [];



  return (
    <div className="space-y-6">
      {/* GST Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {gstMetrics.map((metric: any) => (
          <OverviewCard key={metric.id} {...metric} />
        ))}
      </div>
      
      {/* GST Ledger Table */}
      <TaxLedgerTable 
        title="GST Collection Ledger" 
        data={gstLedgerData} 
        taxType="GST"
      />
      
      {/* GST Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">GST Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
            <div className="font-medium text-gray-900 dark:text-white">Generate GST Report</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Export monthly GST collection report</div>
          </button>
          <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
            <div className="font-medium text-gray-900 dark:text-white">File GST Return</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Submit monthly GST return to authorities</div>
          </button>
          <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
            <div className="font-medium text-gray-900 dark:text-white">Reconcile GST</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Match GST records with partner payments</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSTDashboard;