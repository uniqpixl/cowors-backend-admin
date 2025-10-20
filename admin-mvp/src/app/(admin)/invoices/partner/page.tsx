import type { Metadata } from "next";
import PartnerInvoiceListContent from "../../../../components/invoices/partner/PartnerInvoiceListContent";

export const metadata: Metadata = {
  title: "Partner Invoices | Admin Dashboard",
  description: "Manage Cowors-issued invoices to partners",
};

export default function PartnerInvoicesPage() {
  return (
    <div className="space-y-6">
      <PartnerInvoiceListContent />
    </div>
  );
}