import { Metadata } from "next";
import PayoutListContent from "@/components/finance/PayoutListContent";

export const metadata: Metadata = {
  title: "Payouts | Admin Dashboard",
  description: "Track and manage all partner payout requests",
};

const PayoutsPage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <PayoutListContent />
      </div>
    </>
  );
};

export default PayoutsPage;