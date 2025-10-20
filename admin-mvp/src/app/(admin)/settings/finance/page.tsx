import { Metadata } from "next";
import FinanceSettingsContent from "@/components/settings/FinanceSettingsContent";

export const metadata: Metadata = {
  title: "Finance Settings | Cowors Admin",
  description: "Manage commission settings, payout cycles, tax configuration, and wallet management",
};

export default function FinanceSettingsPage() {
  return <FinanceSettingsContent />;
}