"use client";
import React from "react";
import { AlertTriangle, Star, MessageSquare, TrendingUp, Clock, Loader2, AlertCircle } from "lucide-react";
import { useReviewAnalytics, useReviews } from "@/hooks/useReviews";

interface Alert {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
}

const ReviewsAlerts: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = useReviewAnalytics();
  const { data: flaggedReviews, isLoading: flaggedLoading } = useReviews({ 
    status: 'flagged', 
    limit: 5 
  });
  const { data: pendingReviews, isLoading: pendingLoading } = useReviews({ 
    status: 'pending', 
    limit: 5 
  });

  const isLoading = analyticsLoading || flaggedLoading || pendingLoading;

  // Generate dynamic alerts based on API data
  const alerts: Alert[] = [];

  // Add flagged review alerts
  if (flaggedReviews?.data && flaggedReviews.data.length > 0) {
    flaggedReviews.data.slice(0, 2).forEach(review => {
      alerts.push({
        id: `flagged-${review.id}`,
        type: "error",
        title: "Flagged Review",
        message: `Review for ${review.spaceName} has been flagged`,
        timestamp: new Date(review.createdAt).toLocaleDateString()
      });
    });
  }

  // Add pending review alerts
  if (pendingReviews?.data && pendingReviews.data.length > 0) {
    alerts.push({
      id: "pending-reviews",
      type: "info",
      title: "Review Response Needed",
      message: `${pendingReviews.data.length} reviews are pending approval`,
      timestamp: "Recent"
    });
  }

  // Add rating milestone alerts
  if (analytics?.averageRating && analytics.averageRating >= 4.8) {
    alerts.push({
      id: "rating-milestone",
      type: "success",
      title: "Rating Milestone",
      message: `Excellent! Average rating reached ${analytics.averageRating.toFixed(1)}★`,
      timestamp: "Today"
    });
  }

  // Add low rating alerts
  if (analytics?.averageRating && analytics.averageRating < 4.0) {
    alerts.push({
      id: "low-rating",
      type: "warning",
      title: "Low Rating Alert",
      message: `Average rating dropped to ${analytics.averageRating.toFixed(1)}★`,
      timestamp: "Recent"
    });
  }

  const quickStats = [
    {
      label: "Avg Response Time",
      value: "2.5 hours",
      icon: <Clock className="w-4 h-4" />
    },
    {
      label: "Review Velocity",
      value: "+12.5%",
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      label: "Average Rating",
      value: analytics?.averageRating ? `${analytics.averageRating.toFixed(1)}★` : "N/A",
      icon: <Star className="w-4 h-4" />
    }
  ];

  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          icon: "text-yellow-600 dark:text-yellow-400",
          text: "text-yellow-800 dark:text-yellow-200"
        };
      case "error":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          icon: "text-red-600 dark:text-red-400",
          text: "text-red-800 dark:text-red-200"
        };
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          icon: "text-green-600 dark:text-green-400",
          text: "text-green-800 dark:text-green-200"
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: "text-blue-600 dark:text-blue-400",
          text: "text-blue-800 dark:text-blue-200"
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-red-600" />
              <span className="text-gray-600 dark:text-gray-400">Loading alerts...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Review Alerts
          </h3>
          <button className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">No alerts at this time</p>
            </div>
          ) : (
            alerts.map((alert) => {
               const styles = getAlertStyles(alert.type);
               return (
                 <div
                   key={alert.id}
                   className={`rounded-lg border p-3 ${styles.bg} ${styles.border}`}
                 >
                   <div className="flex items-start space-x-3">
                     <div className={`mt-0.5 ${styles.icon}`}>
                       {alert.type === "warning" && <AlertTriangle className="w-4 h-4" />}
                       {alert.type === "error" && <AlertTriangle className="w-4 h-4" />}
                       {alert.type === "success" && <Star className="w-4 h-4" />}
                       {alert.type === "info" && <MessageSquare className="w-4 h-4" />}
                     </div>
                     <div className="flex-1">
                       <h4 className={`text-sm font-medium ${styles.text}`}>
                         {alert.title}
                       </h4>
                       <p className={`text-xs ${styles.text} opacity-80`}>
                         {alert.message}
                       </p>
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                         {alert.timestamp}
                       </p>
                     </div>
                   </div>
                 </div>
               );
             })
           )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Quick Stats
        </h3>
        
        <div className="space-y-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.icon}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsAlerts;