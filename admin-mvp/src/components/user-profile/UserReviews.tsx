"use client";

import React, { useState } from "react";
import { Review, UserProfileComponentProps } from "@/types/user-profile";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UserReviewsProps extends UserProfileComponentProps {}

const reviews: Review[] = [
  {
    id: "REV-2024-001",
    rating: 5,
    title: "Excellent Workspace!",
    comment: "The private office was outstanding. Very professional environment and great amenities. Highly recommended!",
    date: "2024-01-15",
    service: "Private Office",
    partner: "WeWork Central",
    status: "published",
    helpfulVotes: 12,
    verified: true
  },
  {
    id: "REV-2024-002",
    rating: 4,
    title: "Good meeting space",
    comment: "The meeting room was well-equipped, but the air conditioning could be better. Overall satisfied with the booking.",
    date: "2024-01-12",
    service: "Meeting Room B",
    partner: "TechHub Spaces",
    status: "published",
    helpfulVotes: 8,
    verified: true
  },
  {
    id: "REV-2024-003",
    rating: 3,
    title: "Average hot desk experience",
    comment: "The hot desk was okay. Some noise issues and WiFi was a bit slow. Price was fair though.",
    date: "2024-01-10",
    service: "Hot Desk",
    partner: "Innovation Center",
    status: "pending",
    helpfulVotes: 5,
    verified: false
  },
  {
    id: "REV-2024-004",
    rating: 5,
    title: "Perfect conference room",
    comment: "Amazing conference room with all the latest tech. Very professional setup and excellent service. Will definitely book again.",
    date: "2024-01-08",
    service: "Conference Room A",
    partner: "Creative Workspace",
    status: "published",
    helpfulVotes: 15,
    verified: true
  },
  {
    id: "REV-2024-005",
    rating: 2,
    title: "Disappointing event space",
    comment: "The event space was not up to expectations. Setup was delayed and some equipment was faulty.",
    date: "2024-01-05",
    service: "Event Space",
    partner: "Startup Hub",
    status: "flagged",
    helpfulVotes: 3,
    verified: false
  }
];

type FilterType = "all" | "published" | "pending" | "flagged";

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800";
    case "under_review":
      return "bg-yellow-100 text-yellow-800";
    case "flagged":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function UserReviews({}: UserReviewsProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  const getButtonClass = (filter: FilterType) =>
    selectedFilter === filter
      ? "shadow-theme-xs text-gray-900 bg-white"
      : "text-gray-500";

  const filteredReviews = reviews.filter(review => {
    if (selectedFilter === "all") return true;
    return review.status === selectedFilter;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 shadow-sm sm:px-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              User Reviews
            </h3>
            <p className="text-sm text-gray-500">
              Reviews and ratings from bookings
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 w-fit">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 ${getButtonClass("all")}`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setSelectedFilter("published")}
            className={`px-3 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 ${getButtonClass("published")}`}
          >
            Published
          </button>
          <button
            onClick={() => setSelectedFilter("pending")}
            className={`px-3 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 ${getButtonClass("pending")}`}
          >
            Pending
          </button>
          <button
            onClick={() => setSelectedFilter("flagged")}
            className={`px-3 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 ${getButtonClass("flagged")}`}
          >
            Flagged
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews found for the selected filter.
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex flex-col gap-3">
                {/* Review Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(review.rating)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                        {review.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-base">
                      {review.title}
                    </h4>
                  </div>
                  <div className="text-sm text-gray-500">
                    {review.date}
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-gray-700 text-sm leading-relaxed">
                  {review.comment}
                </p>

                {/* Review Details */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-200">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <div className="text-xs text-gray-500 mt-1">
                      Service: {review.service} • Partner: {review.partner}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    {review.helpfulVotes} helpful
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}