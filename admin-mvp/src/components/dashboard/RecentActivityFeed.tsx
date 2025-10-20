"use client";
import React from "react";
import { CalenderIcon, ChatIcon, BoxIcon, UserIcon, TimeIcon } from "@/icons";
import { IndianRupee } from "lucide-react";
import { useActivityFeed } from "@/hooks/useActivityFeed";

interface Activity {
  id: string;
  type: "booking" | "payout" | "ticket" | "partner";
  title: string;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "processing" | "new";
  amount?: string;
  user?: string;
  location?: string;
}

const RecentActivityFeed: React.FC = () => {
  // API data fetching
  const { data: activities, isLoading, error } = useActivityFeed({
    limit: 6 // Limit to 6 activities like the mock data
  });

  const getActivityIcon = (type: Activity["type"]) => {
    const iconColor = getIconColor(type);
    switch (type) {
      case "booking":
        return <CalenderIcon className={`h-4 w-4 ${iconColor}`} />;
      case "payout":
        return <IndianRupee className={`h-4 w-4 ${iconColor}`} />;
      case "ticket":
        return <ChatIcon className={`h-4 w-4 ${iconColor}`} />;
      case "partner":
        return <BoxIcon className={`h-4 w-4 ${iconColor}`} />;
      default:
        return <UserIcon className={`h-4 w-4 ${iconColor}`} />;
    }
  };

  const getStatusColor = (status: Activity["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "processing":
        return "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-300";
      case "new":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeColor = () => {
    // Use consistent gray backgrounds for all activity types
    return "bg-gray-100 dark:bg-gray-800";
  };

  const getIconColor = (type: Activity["type"]) => {
    // Use red accent for high-priority activities, gray for others
    switch (type) {
      case "booking":
      case "partner":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-800 dark:text-white/90";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
              <div className="bg-gray-200 rounded-xl h-10 w-10 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Latest platform activities and updates
            </p>
          </div>
          <button className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            <span>View All</span>
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 font-medium">Error loading activities</p>
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
          <button 
            className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Recent Activity
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest platform activities and updates
          </p>
        </div>
        <button className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
          <span>View All</span>
        </button>
      </div>

      <div className="space-y-4">
        {activities && activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 rounded-2xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getTypeColor()}`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 dark:text-white/90">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <TimeIcon className="h-3 w-3" />
                      <span>{activity.timestamp}</span>
                    </div>
                    {activity.user && (
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{activity.user}</span>
                      </div>
                    )}
                    {activity.location && (
                      <div className="flex items-center space-x-1">
                        <BoxIcon className="h-3 w-3" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                  {activity.amount && (
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {activity.amount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityFeed;