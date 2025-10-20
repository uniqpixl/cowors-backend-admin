import { Metadata } from "next";
import ProfileSettingsContent from "@/components/settings/ProfileSettingsContent";

export const metadata: Metadata = {
  title: "Profile Settings | Cowors Admin",
  description: "Manage your admin profile and preferences",
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsContent />;
}