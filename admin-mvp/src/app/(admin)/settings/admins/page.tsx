import { Metadata } from "next";
import AdminUsersContent from "@/components/settings/AdminUsersContent";

export const metadata: Metadata = {
  title: "Admin Users | Cowors Admin",
  description: "Manage admin users, roles, and permissions",
};

export default function AdminUsersPage() {
  return <AdminUsersContent />;
}