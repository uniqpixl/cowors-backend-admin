"use client";
import React from "react";
import OverviewCard from "./OverviewCard";
import TaxLedgerTable from "./TaxLedgerTable";
import { useTCSData } from '@/hooks/useTaxes';
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, TrendingUp, FileText, AlertCircle, Percent, Users } from "lucide-react";

const TCSDashboard: React.FC = () => {
  const { data: tcsData, isLoading, error } = useTCSData();

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
    const fallbackTcsData = {
      metrics: [
        { id: 1, title: "Total TCS Collected", value: "₹2,45,890", icon: <IndianRupee className="w-5 h-5" />, change: "+15.2%", changeType: "increase" as const, description: "vs last month" },
        { id: 2, title: "TCS Rate", value: "1%", icon: <Percent className="w-5 h-5" />, change: "0%", changeType: "neutral" as const, description: "standard rate" },
        { id: 3, title: "Transactions", value: "1,234", icon: <FileText className="w-5 h-5" />, change: "+45", changeType: "increase" as const, description: "vs last month" },
        { id: 4, title: "Pending Deposit", value: "₹45,230", icon: <AlertCircle className="w-5 h-5" />, change: "-8.1%", changeType: "decrease" as const, description: "vs last month" },
        { id: 5, title: "Growth", value: "+12.5%", icon: <TrendingUp className="w-5 h-5" />, change: "+3.2%", changeType: "increase" as const, description: "vs last quarter" },
        { id: 6, title: "Affected Users", value: "892", icon: <Users className="w-5 h-5" />, change: "+67", changeType: "increase" as const, description: "vs last month" }
      ],
      ledgerEntries: []
    };
    
    return (
      <div className="space-y-6">
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <AlertCircle className="inline w-4 h-4 mr-2" />
            TCS API endpoint not available. Showing sample data for demonstration.
          </p>
        </div>
        
        {/* TCS Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {fallbackTcsData.metrics.map((metric: any) => (
            <OverviewCard key={metric.id} {...metric} />
          ))}
        </div>
        
        {/* TCS Ledger Table */}
        <TaxLedgerTable 
          title="TCS Deduction Ledger"
          data={fallbackTcsData.ledgerEntries}
          taxType="TCS"
        />
        
        {/* Additional TCS Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              TCS Management Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Generate TCS Report</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Export quarterly TCS collection report</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Deposit TCS</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Deposit collected TCS to government</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Issue TCS Certificates</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Generate TCS certificates for users</div>
              </button>
            </div>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent TCS Activities
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">TCS Deposited</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">₹1,87,450 TCS deposited to government</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">3 hours ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">TCS Collected</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">₹2,450 TCS collected from Tech Startup Inc.</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">6 hours ago</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Certificate Issued</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">TCS certificate issued to 25 users</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">1 day ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tcsMetrics = tcsData?.metrics || [];
  const tcsLedgerData = tcsData?.ledgerEntries || [];

  return (
    <div className="space-y-6">
      {/* TCS Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tcsMetrics.map((metric: any) => (
          <OverviewCard key={metric.id} {...metric} />
        ))}
      </div>
      
      {/* TCS Ledger Table */}
      <TaxLedgerTable 
        title="TCS Deduction Ledger"
        data={tcsLedgerData}
        taxType="TCS"
      />
      
      {/* Additional TCS Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            TCS Management Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Generate TCS Report</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Export quarterly TCS collection report</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Deposit TCS</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Deposit collected TCS to government</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 dark:border-gray-700 dark:hover:border-red-600 dark:hover:bg-red-900/20 transition-colors">
              <div className="font-medium text-gray-900 dark:text-white">Issue TCS Certificates</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Generate TCS certificates for users</div>
            </button>
          </div>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent TCS Activities
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">TCS Deposited</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">₹1,87,450 TCS deposited to government</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">3 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">TCS Collected</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">₹2,450 TCS collected from Tech Startup Inc.</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">6 hours ago</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">Certificate Issued</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">TCS certificate issued to 25 users</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TCSDashboard;