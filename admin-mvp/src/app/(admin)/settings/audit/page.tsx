import { Metadata } from "next";
import AuditLogsContent from "@/components/settings/AuditLogsContent";

export const metadata: Metadata = {
  title: "Audit Logs - Cowors Admin",
  description: "View and export audit logs of all admin actions",
};

export default function AuditLogsPage() {
  return <AuditLogsContent />;
}