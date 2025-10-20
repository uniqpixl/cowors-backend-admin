"use client";
import React from "react";
import { Star, MessageSquare, ThumbsUp, AlertCircle, ArrowUpIcon, ArrowDownIcon, Loader2 } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { useReviewAnalytics } from "@/hooks/useReviews";

interface ReviewMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
}

const ReviewsMetrics: React.FC = () => {
  const { data: analytics, isLoading, error } = useReviewAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
            <div className="mt-5 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
              <div className="h-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 dark:text-red-400">Failed to load review metrics</span>
        </div>
      </div>
    );
  }

  const positiveReviews = analytics ? ((analytics.reviewsByRating?.[4] || 0) + (analytics.reviewsByRating?.[5] || 0)) : 0;
  const responseRate = analytics ? ((analytics.reviewsByStatus?.approved || 0) / (analytics.totalReviews || 1) * 100).toFixed(1) : '0';

  const reviewMetrics: ReviewMetric[] = [
    {
      id: "1",
      title: "Average Rating",
      value: analytics?.averageRating.toFixed(1) || "0.0",
      change: "+0.2",
      changeType: "increase",
      icon: <Star className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "2",
      title: "Total Reviews",
      value: analytics?.totalReviews.toLocaleString() || "0",
      change: "+12.5%",
      changeType: "increase",
      icon: <MessageSquare className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "3",
      title: "Positive Reviews",
      value: positiveReviews.toLocaleString(),
      change: "+8.3%",
      changeType: "increase",
      icon: <ThumbsUp className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "4",
      title: "Response Rate",
      value: `${responseRate}%`,
      change: "+5.1%",
      changeType: "increase",
      icon: <MessageSquare className="text-gray-800 size-6 dark:text-white/90" />
    },
    {
      id: "5",
      title: "Pending Reviews",
      value: analytics?.reviewsByStatus?.pending?.toLocaleString() || "0",
      change: "-15.4%",
      changeType: "decrease",
      icon: <AlertCircle className="text-gray-800 size-6 dark:text-white/90" />
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6">
      {reviewMetrics.map((metric) => (
        <div
          key={metric.id}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {metric.icon}
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value}
                {metric.title === "Average Rating" && (
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (analytics?.averageRating || 0)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </h4>
            </div>
            <Badge color={metric.changeType === "increase" ? "success" : "error"}>
              {metric.changeType === "increase" ? (
                <ArrowUpIcon className="w-3 h-3" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-red-500" />
              )}
              {metric.change}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewsMetrics;