import { Metadata } from "next";
import LocationsContent from "@/components/settings/LocationsContent";

export const metadata: Metadata = {
  title: "Serviceable Locations | Cowors Admin",
  description: "Manage serviceable cities for platform operations",
};

export default function LocationsSettingsPage() {
  return <LocationsContent />;
}