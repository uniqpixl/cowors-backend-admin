"use client";
import React from "react";
import { PlusIcon, UserIcon, BoxIcon, GridIcon, PieChartIcon, BellIcon } from "@/icons";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  isPrimary?: boolean;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      id: "1",
      title: "Add New Partner",
      description: "Register a new workspace partner",
      icon: <PlusIcon className="text-gray-800 size-6 dark:text-white/90" />,
      href: "/partners/new",
      isPrimary: true
    },
    {
      id: "2",
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: <UserIcon className="text-gray-800 size-6 dark:text-white/90" />,
      href: "/users"
    },
    {
      id: "3",
      title: "Partner Approvals",
      description: "Review pending partner applications",
      icon: <BoxIcon className="text-gray-800 size-6 dark:text-white/90" />,
      href: "/partners/approvals",
      isPrimary: true
    },
    {
      id: "4",
      title: "System Settings",
      description: "Configure platform settings",
      icon: <GridIcon className="text-gray-800 size-6 dark:text-white/90" />,
      href: "/settings"
    },
    {
      id: "5",
      title: "Analytics",
      description: "View detailed analytics reports",
      icon: <PieChartIcon className="text-gray-800 size-6 dark:text-white/90" />,
      href: "/analytics"
    },
    {
      id: "6",
      title: "Notifications",
      description: "Manage system notifications",
      icon: <BellIcon className="text-gray-800 size-6 dark:text-white/90" />,
      href: "/notifications"
    }
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Quick Actions
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Frequently used administrative tasks
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className={`group flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 ${
              action.isPrimary
                ? "border-red-200 bg-red-50 hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800 mb-3">
              {action.icon}
            </div>
            <h4 className={`mb-2 font-medium transition-colors ${
              action.isPrimary
                ? "text-red-800 group-hover:text-red-900 dark:text-red-300 dark:group-hover:text-red-200"
                : "text-gray-800 group-hover:text-gray-900 dark:text-white/90 dark:group-hover:text-white"
            }`}>
              {action.title}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {action.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;