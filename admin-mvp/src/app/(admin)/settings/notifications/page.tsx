import { Metadata } from "next";
import NotificationsContent from "@/components/settings/NotificationsContent";

export const metadata: Metadata = {
  title: "Notifications | Cowors Admin",
  description: "Manage email templates, notification settings, and test send functionality",
};

export default function NotificationsPage() {
  return <NotificationsContent />;
}