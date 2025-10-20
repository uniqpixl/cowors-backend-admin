"use client";
import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";
import Badge from "../ui/badge/Badge";

interface OverviewCardProps {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ReactNode;
  description: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  description,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          {icon}
        </div>
        <Badge color={changeType === "increase" ? "success" : "error"}>
          {changeType === "increase" ? (
            <ArrowUpIcon className="w-3 h-3" />
          ) : (
            <ArrowDownIcon className="w-3 h-3" />
          )}
          {change}
        </Badge>
      </div>
      
      <div>
        <h4 className="font-bold text-gray-800 text-lg dark:text-white/90 mb-1">
          {value}
        </h4>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
};

export default OverviewCard;