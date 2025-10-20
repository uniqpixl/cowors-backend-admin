import { Metadata } from "next";
import DataManagementContent from "@/components/settings/DataManagementContent";

export const metadata: Metadata = {
  title: "Data Management | Cowors Admin",
  description: "Manage data export, backup, and retention policies",
};

export default function DataManagementPage() {
  return <DataManagementContent />;
}