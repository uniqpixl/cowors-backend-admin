import { Metadata } from "next";
import SpaceListContent from "@/components/spaces/SpaceListContent";

export const metadata: Metadata = {
  title: "Spaces | Cowors Admin",
  description: "Manage spaces, view details, and handle space status",
};

export default function SpacesPage() {
  return (
    <div className="space-y-6">
      <SpaceListContent />
    </div>
  );
}