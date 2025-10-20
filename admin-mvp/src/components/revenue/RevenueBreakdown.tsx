"use client";
import React from "react";
import { Building2, Calendar, Users, CreditCard, TrendingUp, MapPin, Loader2 } from "lucide-react";
import { useRevenueBreakdown } from "@/hooks/useAnalytics";

interface RevenueSource {
  id: string;
  name: string;
  amount: string;
  percentage: number;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
  color: string;
}

interface TopPerformingSpace {
  id: string;
  name: string;
  location: string;
  revenue: string;
  bookings: number;
  growth: string;
}

const RevenueBreakdown: React.FC = () => {
  const { data: breakdownData, isLoading, error } = useRevenueBreakdown();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2 flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Revenue Sources...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
              Failed to load revenue breakdown
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const revenueSources: RevenueSource[] = breakdownData?.revenueSources || [
    {
      id: "1",
      name: "Coworking Spaces",
      amount: "₹4,85,200",
      percentage: 42,
      change: "+15.2%",
      changeType: "increase",
      icon: <Building2 className="w-5 h-5" />,
      color: "bg-red-500"
    },
    {
      id: "2",
      name: "Meeting Rooms",
      amount: "₹2,34,800",
      percentage: 28,
      change: "+22.8%",
      changeType: "increase",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-red-400"
    },
    {
      id: "3",
      name: "Event Spaces",
      amount: "₹1,45,600",
      percentage: 18,
      change: "+8.5%",
      changeType: "increase",
      icon: <Users className="w-5 h-5" />,
      color: "bg-red-300"
    },
    {
      id: "4",
      name: "Membership Fees",
      amount: "₹89,400",
      percentage: 12,
      change: "-3.2%",
      changeType: "decrease",
      icon: <CreditCard className="w-5 h-5" />,
      color: "bg-red-200"
    }
  ];

  const topPerformingSpaces: TopPerformingSpace[] = breakdownData?.topPerformingSpaces || [
    {
      id: "1",
      name: "WeWork BKC",
      location: "Mumbai",
      revenue: "₹1,25,400",
      bookings: 156,
      growth: "+18.5%"
    },
    {
      id: "2",
      name: "Innov8 Connaught Place",
      location: "Delhi",
      revenue: "₹98,200",
      bookings: 134,
      growth: "+12.3%"
    },
    {
      id: "3",
      name: "91springboard Koramangala",
      location: "Bangalore",
      revenue: "₹87,600",
      bookings: 128,
      growth: "+15.7%"
    },
    {
      id: "4",
      name: "BHIVE Workspace HSR",
      location: "Bangalore",
      revenue: "₹76,800",
      bookings: 112,
      growth: "+9.2%"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Sources Breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
            Revenue Sources
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Breakdown of revenue by different booking categories
          </p>
        </div>
        
        <div className="space-y-4">
          {revenueSources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 ${source.color} rounded-lg text-white`}>
                  {source.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white/90">
                    {source.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {source.percentage}% of total revenue
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-gray-800 dark:text-white/90">
                  {source.amount}
                </p>
                <p className={`text-sm ${
                  source.changeType === "increase" 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {source.change}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Distribution</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">₹8,55,000</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="bg-red-500" style={{ width: '42%' }}></div>
              <div className="bg-red-400" style={{ width: '28%' }}></div>
              <div className="bg-red-300" style={{ width: '18%' }}></div>
              <div className="bg-red-200" style={{ width: '12%' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Performing Spaces */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
            Top Performing Spaces
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Highest revenue generating partner spaces this month
          </p>
        </div>
        
        <div className="space-y-4">
          {topPerformingSpaces.map((space, index) => (
            <div key={space.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white/90">
                    {space.name}
                  </h4>
                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{space.location}</span>
                    <span>•</span>
                    <span>{space.bookings} bookings</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-gray-800 dark:text-white/90">
                  {space.revenue}
                </p>
                <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{space.growth}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakdown;