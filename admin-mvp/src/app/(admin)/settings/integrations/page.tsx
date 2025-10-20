import { Metadata } from "next";
import IntegrationsContent from "@/components/settings/IntegrationsContent";

export const metadata: Metadata = {
  title: "Integrations | Cowors Admin",
  description: "Manage API keys, webhooks, and third-party integrations",
};

export default function IntegrationsPage() {
  return <IntegrationsContent />;
}