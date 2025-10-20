import { Metadata } from "next";
import SystemConfigContent from "@/components/settings/SystemConfigContent";

export const metadata: Metadata = {
  title: "System Configuration - Cowors Admin",
  description: "Manage platform settings, maintenance mode, and system configuration",
};

export default function SystemConfigPage() {
  return (
    <div className="space-y-6">
      <SystemConfigContent />
    </div>
  );
}