import { Metadata } from "next";
import ReviewsDashboard from "@/components/reviews/ReviewsDashboard";

export const metadata: Metadata = {
  title: "Reviews Management | Admin Dashboard",
  description: "Comprehensive review management, ratings analysis, and customer feedback insights",
};

const ReviewsPage = () => {
  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reviews Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor customer reviews, ratings, and feedback across all partner spaces
          </p>
        </div>
        
        <ReviewsDashboard />
      </div>
    </>
  );
};

export default ReviewsPage;