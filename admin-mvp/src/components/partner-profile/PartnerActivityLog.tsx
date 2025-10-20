"use client";
import React from "react";
import PartnerActivityLogContent from "./PartnerActivityLogContent";

interface PartnerActivityLogProps {
  partnerId: string;
}

const PartnerActivityLog: React.FC<PartnerActivityLogProps> = ({ /*partnerId*/ }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Activity Log
        </h3>
        <p className="text-sm text-gray-500">
          Timeline of partner events: logins, space updates, bookings, payouts, compliance updates, admin actions
        </p>
      </div>
      
      <PartnerActivityLogContent />
    </div>
  );
};

export default PartnerActivityLog;