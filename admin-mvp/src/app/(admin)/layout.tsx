"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import AdminRouteGuard from "@/components/auth/AdminRouteGuard";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const [portWarning, setPortWarning] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPort = window.location.port || '80';
      if (currentPort !== '3001') {
        setPortWarning(`Admin app must run on port 3001. Current port: ${currentPort}`);
      }
    }
  }, []);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // All pages under this route group should be protected
  return (
    <AdminRouteGuard requiredRoles={['Admin', 'SuperAdmin']}>
      <div className="min-h-screen xl:flex">
        {portWarning && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-sm px-4 py-2">
            {portWarning}
          </div>
        )}
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}