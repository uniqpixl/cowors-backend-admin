"use client";
import React from "react";
import { CalenderIcon, ChatIcon, UserIcon } from "@/icons";
import { IndianRupee } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { KPIMetric } from "@/types/partner-profile";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Wallet, CreditCard } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { usePartner } from '@/hooks/usePartners';

interface PartnerSummaryKPIProps {
  partnerId: string;
}

const PartnerSummaryKPI: React.FC<PartnerSummaryKPIProps> = ({ partnerId }) => {
  const { data: partner, isLoading, error } = usePartner(partnerId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <p className="text-red-500">Error loading partner data</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <p className="text-gray-500">Partner not found</p>
      </div>
    );
  }

  // Use partner data with fallbacks
  const totalRevenue = partner.totalRevenue || 0;
  const commissionRate = 15; // Default commission rate
  const commissionPaid = Math.round(totalRevenue * (commissionRate / 100));
  const partnerRevenue = totalRevenue - commissionPaid;
  
  const financialData = {
    totalBookings: partner.totalBookings || 0,
    totalRevenue: totalRevenue,
    spaceRating: partner.averageRating || 0,
    totalReviews: partner.totalReviews || 0,
    partnerRevenue: partnerRevenue,
    commissionPaid: commissionPaid,
    commissionRate: commissionRate,
    walletBalance: 0, // Mock value since walletBalance is not available in Partner interface
    monthlyGrowth: {
      bookings: '+12%',
      revenue: '+8%',
      rating: '+0.2',
      reviews: '+15%',
      walletBalance: '+₹2,500'
    }
  };
  
  const metrics: KPIMetric[] = [
    {
      id: "space-bookings",
      title: "Space Bookings",
      value: financialData.totalBookings.toString(),
      change: financialData.monthlyGrowth.bookings,
      changeType: "increase",
      icon: CalenderIcon,
      color: "text-purple-600"
    },
    {
      id: "partner-revenue",
      title: "Partner Revenue",
      value: formatCurrency(financialData.partnerRevenue),
      change: financialData.monthlyGrowth.revenue,
      changeType: "increase",
      icon: IndianRupee,
      color: "text-green-600"
    },
    {
      id: "commission-paid",
      title: "Commission Paid",
      value: formatCurrency(financialData.commissionPaid),
      change: `${financialData.commissionRate}%`,
      changeType: "neutral",
      icon: CreditCard,
      color: "text-orange-600"
    },
    {
      id: "wallet-balance",
      title: "Wallet Balance",
      value: formatCurrency(financialData.walletBalance),
      change: financialData.monthlyGrowth.walletBalance,
      changeType: "increase",
      icon: Wallet,
      color: "text-blue-600"
    },
    {
      id: "space-rating",
      title: "Space Rating",
      value: financialData.spaceRating.toString(),
      change: financialData.monthlyGrowth.rating,
      changeType: "increase",
      icon: ChatIcon,
      color: "text-yellow-600"
    },
    {
      id: "space-reviews",
      title: "Total Reviews",
      value: financialData.totalReviews.toString(),
      change: financialData.monthlyGrowth.reviews,
      changeType: "increase",
      icon: UserIcon,
      color: "text-brand-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 md:gap-6 w-full">
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

export default PartnerSummaryKPI;