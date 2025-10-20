import { Metadata } from "next";
import TransactionListContent from "@/components/finance/transactions/TransactionListContent";

export const metadata: Metadata = {
  title: "Transactions | Cowors Admin",
  description: "Manage transactions, view transaction details, and handle transaction status",
};

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <TransactionListContent />
    </div>
  );
}