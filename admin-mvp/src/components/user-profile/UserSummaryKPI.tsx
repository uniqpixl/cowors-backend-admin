"use client";
import React from "react";
import { CalenderIcon, ChatIcon } from "@/icons";
import { IndianRupee } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { KPIMetric, UserProfileComponentProps } from "@/types/user-profile";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Wallet } from "lucide-react";
import { useAdminUser } from '@/hooks/useAdminUsers';

interface UserSummaryKPIProps extends UserProfileComponentProps {
  userId: string;
}

const UserSummaryKPI: React.FC<UserSummaryKPIProps> = ({ userId }) => {
  const { data: user, isLoading, error } = useAdminUser(userId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6 w-full">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm min-w-0 overflow-hidden w-full"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="flex justify-end">
                <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6 w-full">
        <div className="col-span-full text-center py-8 text-red-600 text-sm">
          Failed to load user metrics
        </div>
      </div>
    );
  }

  // Calculate metrics from user data (using default values since AdminUser doesn't have these properties)
  const totalBookings = 0; // user.totalBookings not available on AdminUser
  const totalRevenue = 0; // user.totalRevenue not available on AdminUser
  const averageRating = 0; // user.averageRating not available on AdminUser
  const walletBalance = 0; // user.walletBalance not available on AdminUser

  // Generate some mock changes for demo purposes
  const bookingChange = totalBookings > 10 ? "+12%" : totalBookings > 5 ? "+8%" : "+5%";
  const revenueChange = totalRevenue > 50000 ? "+15%" : totalRevenue > 20000 ? "+10%" : "+5%";
  const ratingChange = averageRating >= 4.5 ? "+0.2" : averageRating >= 4.0 ? "+0.1" : "0.0";
  const walletChange = walletBalance > 10000 ? "+₹1,000" : walletBalance > 5000 ? "+₹500" : "+₹200";

  const metrics: KPIMetric[] = [
    {
      id: "total-bookings",
      title: "Total Bookings",
      value: totalBookings.toString(),
      change: bookingChange,
      changeType: "increase",
      icon: CalenderIcon,
      color: "text-brand-600"
    },
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      change: revenueChange,
      changeType: "increase",
      icon: IndianRupee,
      color: "text-green-600"
    },
    {
      id: "total-ratings",
      title: "Average Rating",
      value: averageRating.toFixed(1),
      change: ratingChange,
      changeType: averageRating >= 4.0 ? "increase" : "neutral",
      icon: ChatIcon,
      color: "text-yellow-600"
    },
    {
      id: "wallet-balance",
      title: "Wallet Balance",
      value: `₹${walletBalance.toLocaleString('en-IN')}`,
      change: walletChange,
      changeType: "increase",
      icon: Wallet,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6 w-full">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm min-w-0 overflow-hidden w-full"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0">
            <metric.icon className={`h-5 w-5 ${metric.color}`} />
          </div>

          <div className="mt-4 space-y-2">
            <div className="min-w-0">
              <span className="text-sm text-gray-500 block truncate">
                {metric.title}
              </span>
              <h4 className="mt-1 font-bold text-gray-800 text-lg sm:text-xl truncate">
                {metric.value}
              </h4>
            </div>
            <div className="flex justify-end">
              <Badge 
                size="sm" 
                color={metric.changeType === "increase" ? "success" : metric.changeType === "decrease" ? "error" : "light"}
              >
                {metric.changeType === "increase" ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : metric.changeType === "decrease" ? (
                  <ArrowDownIcon className="w-3 h-3" />
                ) : null}
                <span className="truncate">{metric.change}</span>
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserSummaryKPI;