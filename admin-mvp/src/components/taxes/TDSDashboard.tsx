"use client";
import React from "react";
import OverviewCard from "./OverviewCard";
import TaxLedgerTable from "./TaxLedgerTable";
import { useTDSData } from '@/hooks/useTaxes';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, TrendingUp, FileText, AlertCircle, Percent, Building } from "lucide-react";

const TDSDashboard: React.FC = () => {
  const { data: tdsData, isLoading, error } = useTDSData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    // Provide fallback data when API is not available
    const fallbackTdsData = {
      metrics: [
        { id: 1, title: "Total TDS Deducted", value: "₹1,85,670", icon: <IndianRupee className="w-5 h-5" />, change: "+12.5%", changeType: "increase" as const, description: "vs last month" },
        { id: 2, title: "TDS Rate", value: "10%", icon: <Percent className="w-5 h-5" />, change: "0%", changeType: "neutral" as const, description: "standard rate" },
        { id: 3, title: "Transactions", value: "856", icon: <FileText className="w-5 h-5" />, change: "+23", changeType: "increase" as const, description: "vs last month" },
        { id: 4, title: "Pending Deposit", value: "₹32,450", icon: <AlertCircle className="w-5 h-5" />, change: "-5.2%", changeType: "decrease" as const, description: "vs last month" },
        { id: 5, title: "Growth", value: "+8.3%", icon: <TrendingUp className="w-5 h-5" />, change: "+2.1%", changeType: "increase" as const, description: "vs last quarter" },
        { id: 6, title: "Affected Partners", value: "124", icon: <Building className="w-5 h-5" />, change: "+8", changeType: "increase" as const, description: "vs last month" }
      ],
      ledgerEntries: []
    };
    
    return (
      <div className="space-y-6">
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <AlertCircle className="inline w-4 h-4 mr-2" />
            TDS API endpoint not available. Showing sample data for demonstration.
          </p>
        </div>
        
        {/* TDS Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {fallbackTdsData.metrics.map((metric: any) => (
            <OverviewCard key={metric.id} {...metric} />
          ))}
        </div>
        
        {/* TDS Ledger Table */}
        <TaxLedgerTable 
          title="TDS Deduction Ledger"
          data={fallbackTdsData.ledgerEntries}
          taxType="TDS"
        />
        
        {/* Additional TDS Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              TDS Management Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Generate TDS Report</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Export quarterly TDS deduction report</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Update TDS Rates</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Modify TDS deduction rates for different categories</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 dark:border-gray-700 dark:hover:border-green-600 dark:hover:bg-green-900/20 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Issue TDS Certificates</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Generate and send TDS certificates to partners</div>
              </button>
            </div>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent TDS Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">TDS Deposited</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">₹1,45,230 TDS deposited to government</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">2 hours ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">TDS Deducted</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">₹1,850 TDS deducted from Creative Solutions Ltd.</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">4 hours ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Certificate Issued</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">TDS certificate issued to 18 partners</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">1 day ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tdsMetrics = tdsData?.metrics || [];
  const tdsLedgerData = tdsData?.ledgerEntries || [];

  return (
    <div className="space-y-6">
      {/* TDS Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tdsMetrics.map((metric: any) => (
          <OverviewCard key={metric.id} {...metric} />
        ))}
      </div>
      
      {/* TDS Ledger Table */}
      <TaxLedgerTable 
        title="TDS Ledger"
        data={tdsLedgerData}
        taxType="TDS"
      />
      
      {/* Additional TDS Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            TDS Management Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Generate TDS Report</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Export quarterly TDS deduction report</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Deposit TDS</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Deposit deducted TDS to government</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Issue TDS Certificates</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Generate Form 16A for partners</div>
            </button>
          </div>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent TDS Activities
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">TDS Deposited</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">₹3,45,890 TDS deposited to government</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">4 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">TDS Deducted</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">₹12,000 TDS deducted from Tech Space Providers</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">7 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Certificate Issued</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Form 16A issued to 15 partners</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">2 days ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TDSDashboard;