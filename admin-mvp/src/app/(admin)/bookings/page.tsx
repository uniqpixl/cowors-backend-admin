import { Metadata } from "next";
import BookingListContent from "@/components/bookings/BookingListContent";

export const metadata: Metadata = {
  title: "Bookings | Cowors Admin",
  description: "Manage bookings, view booking details, and handle booking status",
};

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <BookingListContent />
    </div>
  );
}