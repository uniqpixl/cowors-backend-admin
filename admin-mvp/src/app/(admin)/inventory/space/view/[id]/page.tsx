import { Metadata } from "next";
import SpaceViewContent from "@/components/spaces/SpaceViewContent";

interface SpaceViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Space Details | Cowors Admin",
  description: "View detailed space information and manage approval status",
};

export default async function SpaceViewPage({ params }: SpaceViewPageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <SpaceViewContent spaceId={id} />
    </div>
  );
}