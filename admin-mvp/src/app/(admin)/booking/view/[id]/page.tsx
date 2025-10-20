import { Metadata } from "next";
import { BookingDetailCard } from "@/components/bookings/BookingDetailCard";
import { BookingActions } from "@/components/bookings/BookingActions";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { BookingNotes } from "@/components/bookings/BookingNotes";

export const metadata: Metadata = {
  title: "Booking Details | Cowors Admin",
  description: "View and manage booking details",
};

interface BookingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EnhancedBookingView({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="col-span-1 xl:col-span-2">
          <div className="space-y-6">
            <BookingDetailCard bookingId={id} />
            <BookingNotes bookingId={id} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="col-span-1">
          <div className="space-y-6">
            <BookingActions bookingId={id} />
            <BookingTimeline bookingId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}