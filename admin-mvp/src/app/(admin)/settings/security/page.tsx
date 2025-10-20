import { Metadata } from "next";
import SecuritySettingsContent from "@/components/settings/SecuritySettingsContent";

export const metadata: Metadata = {
  title: "Security Settings | Cowors Admin",
  description: "Manage security policies, 2FA, and audit logs",
};

export default function SecuritySettingsPage() {
  return <SecuritySettingsContent />;
}