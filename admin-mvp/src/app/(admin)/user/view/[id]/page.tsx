import UserMetaCardAdmin from "@/components/user-profile/UserMetaCardAdmin";
import UserSummaryKPI from "@/components/user-profile/UserSummaryKPI";
import UserRecentBooking from "@/components/user-profile/UserRecentBooking";
import UserTransactions from "@/components/user-profile/UserTransactions";
import UserReviews from "@/components/user-profile/UserReviews";
import UserSupportTickets from "@/components/user-profile/UserSupportTickets";

import React from "react";

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EnhancedUserView({ params }: UserProfilePageProps) {
  const { id } = await params;

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-2 lg:px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-w-0">
          {/* Sidebar - User Information */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-4 lg:space-y-6">
            <UserMetaCardAdmin userId={id} />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-4 lg:space-y-6 overflow-hidden">
            {/* KPI Cards */}
            <UserSummaryKPI userId={id} />
            
            {/* Content Sections */}
            <UserRecentBooking userId={id} />
            <UserTransactions userId={id} />
            <UserReviews userId={id} />
            <UserSupportTickets userId={id} />

          </div>
        </div>
      </div>
    </div>
  );
}