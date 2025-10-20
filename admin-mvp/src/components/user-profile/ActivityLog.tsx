"use client";
import React from "react";
import { CalenderIcon, ChatIcon, BoxIcon, UserIcon, TimeIcon } from "@/icons";
import { IndianRupee } from "lucide-react";
import { ActivityLogEntry } from "@/types/user-profile";

const ActivityLog: React.FC = () => {
  const activities: ActivityLogEntry[] = [
    {
      id: "ACT-2024-001",
      type: "security",
      action: "login",
      description: "User successfully logged in to the platform",
      timestamp: "2024-01-15T10:30:00Z",
      status: "success",
      ipAddress: "192.168.1.100",
      device: "Chrome on MacOS",
      location: "New York, NY"
    },
    {
      id: "ACT-2024-002",
      type: "booking",
      action: "create",
      description: "Created new booking for private office space",
      timestamp: "2024-01-15T09:45:00Z",
      status: "success",
      ipAddress: "192.168.1.100",
      device: "Chrome on MacOS",
      location: "New York, NY",
      resourceId: "BK-2024-001"
    },
    {
      id: "ACT-2024-003",
      type: "payment",
      action: "process",
      description: "Payment processed for booking #BK-2024-001",
      timestamp: "2024-01-15T09:50:00Z",
      status: "success",
      ipAddress: "192.168.1.100",
      device: "Chrome on MacOS",
      location: "New York, NY",
      resourceId: "PAY-2024-001"
    },
    {
      id: "ACT-2024-004",
      type: "profile",
      action: "update",
      description: "Updated profile information and contact details",
      timestamp: "2024-01-14T16:20:00Z",
      status: "success",
      ipAddress: "10.0.0.50",
      device: "Safari on iPhone",
      location: "Los Angeles, CA"
    },
    {
      id: "ACT-2024-005",
      type: "security",
      action: "logout",
      description: "User logged out from the platform",
      timestamp: "2024-01-14T18:45:00Z",
      status: "success",
      ipAddress: "10.0.0.50",
      device: "Safari on iPhone",
      location: "Los Angeles, CA"
    },
    {
      id: "ACT-2024-006",
      type: "system",
      action: "notification",
      description: "System notification sent for booking reminder",
      timestamp: "2024-01-13T08:00:00Z",
      status: "info",
      ipAddress: "N/A",
      device: "System",
      location: "Server",
      resourceId: "BK-2024-001"
    },
    {
      id: "ACT-2024-007",
      type: "system",
      action: "password_reset",
      description: "Password reset email sent to user",
      timestamp: "2024-01-12T11:45:00Z",
      status: "success",
      ipAddress: "N/A",
      device: "System",
      location: "N/A"
    },
    {
      id: "ACT-2024-008",
      type: "payment",
      action: "refund",
      description: "Refund processed for cancelled booking #BK-2024-002",
      timestamp: "2024-01-11T13:20:00Z",
      status: "success",
      ipAddress: "N/A",
      device: "System",
      location: "N/A",
      resourceId: "REF-2024-001"
    }
  ];

  const getActivityIcon = (type: ActivityLogEntry["type"]) => {
    const iconColor = getIconColor(type);
    switch (type) {
      case "login":
      case "security":
        return <UserIcon className={`h-4 w-4 ${iconColor}`} />;
      case "booking":
        return <CalenderIcon className={`h-4 w-4 ${iconColor}`} />;
      case "payment":
        return <IndianRupee className={`h-4 w-4 ${iconColor}`} />;
      case "profile":
      case "system":
        return <BoxIcon className={`h-4 w-4 ${iconColor}`} />;
      default:
        return <ChatIcon className={`h-4 w-4 ${iconColor}`} />;
    }
  };

  const getStatusColor = (status: ActivityLogEntry["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "info":
        return "bg-brand-100 text-brand-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: ActivityLogEntry["type"]) => {
    switch (type) {
      case "login":
      case "security":
        return "bg-brand-100";
      case "booking":
        return "bg-green-100";
      case "payment":
        return "bg-purple-100";
      case "profile":
        return "bg-orange-100";
      case "system":
        return "bg-gray-100";
      default:
        return "bg-gray-100";
    }
  };

  const getIconColor = (type: ActivityLogEntry["type"]) => {
    switch (type) {
      case "login":
      case "security":
        return "text-brand-600";
      case "booking":
        return "text-green-600";
      case "payment":
        return "text-purple-600";
      case "profile":
        return "text-orange-600";
      case "system":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Complete user activity history and system events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last 30 days
          </span>
          <button className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            <span>Export Log</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 rounded-2xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getTypeColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-800">
                      {activity.action}
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {activity.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activity.description}
                  </p>
                  
                  {activity.details && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {activity.details}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <TimeIcon className="h-3 w-3" />
                      <span>{activity.timestamp}</span>
                    </div>
                    {activity.device && (
                      <div className="flex items-center space-x-1">
                        <BoxIcon className="h-3 w-3" />
                        <span>{activity.device}</span>
                      </div>
                    )}
                    {activity.location && (
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                    {activity.ipAddress && (
                      <div className="flex items-center space-x-1">
                        <ChatIcon className="h-3 w-3" />
                        <span>{activity.ipAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No activity logs found for this user.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;