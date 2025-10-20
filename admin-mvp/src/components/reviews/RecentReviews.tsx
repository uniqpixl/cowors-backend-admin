"use client";
import React from "react";
import { Star, MapPin, Calendar, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import Badge from "../ui/badge/Badge";
import { useReviews } from "@/hooks/useReviews";

interface ReviewDisplay {
  id: string;
  customerName: string;
  spaceName: string;
  rating: number;
  comment: string;
  date: string;
  status: "published" | "pending" | "flagged";
  location: string;
}

const RecentReviews: React.FC = () => {
  const { data: reviewsData, isLoading, error } = useReviews({ 
    limit: 5, 
    sortBy: 'createdAt', 
    sortOrder: 'DESC' 
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Reviews
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Latest customer feedback and ratings
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse dark:bg-gray-700" />
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full animate-pulse dark:bg-gray-700" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Reviews
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Latest customer feedback and ratings
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load reviews</span>
          </div>
        </div>
      </div>
    );
  }

  const recentReviews: ReviewDisplay[] = reviewsData?.data.map(review => ({
    id: review.id,
    customerName: review.userName,
    spaceName: review.spaceName,
    rating: review.rating,
    comment: review.comment,
    date: review.createdAt,
    status: review.status === 'approved' ? 'published' : review.status as 'pending' | 'flagged',
    location: `${review.spaceName} Location` // Fallback since location might not be in review data
  })) || [];

  const getStatusBadge = (status: ReviewDisplay["status"]) => {
    switch (status) {
      case "published":
        return <Badge color="success">Published</Badge>;
      case "pending":
        return <Badge color="warning">Pending</Badge>;
      case "flagged":
        return <Badge color="error">Flagged</Badge>;
      default:
        return <Badge color="light">Unknown</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Reviews
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Latest customer feedback and ratings
          </p>
        </div>
        <button className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {recentReviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border border-gray-100 p-4 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {review.customerName}
                    </h4>
                    {renderStars(review.rating)}
                  </div>
                  {getStatusBadge(review.status)}
                </div>
                
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{review.spaceName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(review.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {review.comment}
                </p>
                
                <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{review.location}</span>
                </div>
              </div>
              
              <button className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentReviews;