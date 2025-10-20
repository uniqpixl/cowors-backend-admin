import { Metadata } from "next";
import PartnerListContent from "@/components/partners/PartnerListContent";

export const metadata: Metadata = {
  title: "Partners | Cowors Admin",
  description: "Manage partners, view profiles, and handle partner status",
};

export default function PartnersPage() {
  return (
    <div className="space-y-6">
      <PartnerListContent />
    </div>
  );
}