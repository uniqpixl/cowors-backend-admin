"use client";
import React from "react";
import ReviewsMetrics from "./ReviewsMetrics";
import ReviewsChart from "./ReviewsChart";
import RecentReviews from "./RecentReviews";
import ReviewsAlerts from "./ReviewsAlerts";

const ReviewsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Key Reviews Metrics */}
      <ReviewsMetrics />
      
      {/* Reviews Chart */}
      <div className="grid grid-cols-1 gap-6">
        <ReviewsChart />
      </div>
      
      {/* Recent Reviews and Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentReviews />
        </div>
        <div>
          <ReviewsAlerts />
        </div>
      </div>
    </div>
  );
};

export default ReviewsDashboard;