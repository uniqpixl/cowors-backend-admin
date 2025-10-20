"use client";
import React from "react";
import ActivityLog from "./ActivityLog";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UserActivityLogProps {}

const UserActivityLog: React.FC<UserActivityLogProps> = ({}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Activity Log
        </h3>
        <p className="text-sm text-gray-500">
          Timeline of user events: logins, bookings, disputes, transactions, KYC updates, admin actions
        </p>
      </div>
      
      <ActivityLog />
    </div>
  );
};

export default UserActivityLog;