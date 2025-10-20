import PartnerMetaCardAdmin from "@/components/partner-profile/PartnerMetaCardAdmin";
import PartnerBusinessInfo from "@/components/partner-profile/PartnerBusinessInfo";
import PartnerSummaryKPI from "@/components/partner-profile/PartnerSummaryKPI";
import PartnerRecentBooking from "@/components/partner-profile/PartnerRecentBooking";
import PartnerTransactions from "@/components/partner-profile/PartnerTransactions";
import PartnerReviews from "@/components/partner-profile/PartnerReviews";
import PartnerSupportTickets from "@/components/partner-profile/PartnerSupportTickets";

import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Enhanced Partner View | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Enhanced Partner View page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

interface PartnerProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EnhancedPartnerView({ params }: PartnerProfilePageProps) {
  const { id } = await params;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-2 lg:px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-w-0">
          {/* Sidebar - Partner Information */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-4 lg:space-y-6">
            <PartnerMetaCardAdmin partnerId={id} />
            <PartnerBusinessInfo partnerId={id} />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-4 lg:space-y-6 overflow-hidden">
            {/* KPI Cards */}
            <PartnerSummaryKPI partnerId={id} />
            
            {/* Content Sections */}
            <PartnerRecentBooking partnerId={id} />
            <PartnerTransactions partnerId={id} />
            <PartnerReviews partnerId={id} />
            <PartnerSupportTickets partnerId={id} />

          </div>
        </div>
      </div>
    </div>
  );
}