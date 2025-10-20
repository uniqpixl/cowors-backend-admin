import { Metadata } from "next";
import UserListContent from "@/components/users/UserListContent";

export const metadata: Metadata = {
  title: "Users | Cowors Admin",
  description: "Manage users, view profiles, and handle user status",
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <UserListContent />
    </div>
  );
}