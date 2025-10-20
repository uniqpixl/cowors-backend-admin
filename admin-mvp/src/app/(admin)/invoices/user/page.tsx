import { Metadata } from "next";
import UserInvoiceListContent from "@/components/invoices/user/UserInvoiceListContent";

export const metadata: Metadata = {
  title: "User Invoices | Cowors Admin",
  description: "Manage partner-issued invoices to users, view invoice details, and handle invoice status",
};

export default function UserInvoicesPage() {
  return (
    <div className="space-y-6">
      <UserInvoiceListContent />
    </div>
  );
}