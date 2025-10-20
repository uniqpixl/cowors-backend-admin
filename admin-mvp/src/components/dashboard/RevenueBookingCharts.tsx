"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useAllAnalytics } from "@/hooks/useAnalytics";
import { useBookingAnalytics } from "@/hooks/useAnalytics";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function RevenueBookingCharts() {
  const [isOpen, setIsOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("weekly");

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // Fetch real analytics data
  const { /*data: analyticsData,*/ isLoading, error } = useAllAnalytics();
  const { data: bookingData } = useBookingAnalytics(chartPeriod);

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-gray-900 h-96 animate-pulse"></div>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-gray-900 h-96 animate-pulse"></div>
        <div className="xl:col-span-3 rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-gray-900 h-96 animate-pulse"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/10">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Analytics Data</h3>
        <p className="text-red-700 dark:text-red-300 text-sm">
          {(error as Error).message || "Failed to load analytics data. Please try again later."}
        </p>
      </div>
    );
  }

  // Prepare data for charts
  const bookingsLineData = {
    series: [
      {
        name: "Bookings",
        data: bookingData?.bookingsByTimeRange?.map((item) => item.count) || 
              (chartPeriod === "weekly" ? [45, 52, 38, 67, 73, 89, 95] : [12, 18, 15, 22, 28, 31, 25, 19, 24, 33, 29, 35, 41, 38])
      }
    ],
    options: {
      colors: ["#d4203d"], // Cowors red
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "line" as const,
        height: 300,
        toolbar: {
          show: false,
        },
      },
      stroke: {
        width: 3,
        curve: "smooth" as const,
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.3,
          gradientToColors: ["#FCA5A5"],
          inverseColors: false,
          opacityFrom: 0.4,
          opacityTo: 0.1,
        },
      },
      markers: {
        size: 4,
        colors: ["#DC2626"],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
      grid: {
        borderColor: "var(--color-gray-200)",
        strokeDashArray: 5,
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        theme: "light",
      },
      xaxis: {
        categories: bookingData?.bookingsByTimeRange?.map((item) => item.date) || 
                  (chartPeriod === "weekly" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]),
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: "var(--color-gray-500)",
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "var(--color-gray-500)",
            fontSize: "12px",
          },
        },
      },
    } as ApexOptions,
  };

  // Bar Chart Data - Partner Type Performance (using mock data for now as we don't have this data in the API)
  const partnerBarData = {
    series: [
      {
        name: "Bookings",
        data: [89, 67, 45, 32, 28],
      },
      {
        name: "Revenue (₹K)",
        data: [156, 98, 67, 45, 38],
      },
    ],
    options: {
      colors: ["#DC2626", "#FCA5A5"], // Cowors red variants
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar" as const,
        height: 300,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "60%",
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 1,
        colors: ["transparent"],
      },
      grid: {
        borderColor: "var(--color-gray-200)",
        strokeDashArray: 5,
      },
      xaxis: {
        categories: ["Cafes", "Coworking", "Restobars", "Hotels", "Libraries"],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: "var(--color-gray-500)",
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "var(--color-gray-500)",
            fontSize: "12px",
          },
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: function (val: number) {
            return val + " bookings";
          },
        },
      },
      legend: {
        position: "top" as const,
        horizontalAlign: "right" as const,
        fontSize: "12px",
        markers: {
          width: 8,
          height: 8,
          radius: 2,
        },
      },
    } as ApexOptions,
  };

  // Pie Chart Data - Payment Gateway Usage (using mock data for now as we don't have this data in the API)
  const paymentPieData = {
    series: [45, 30, 15, 10],
    options: {
      colors: ["#DC2626", "#FCA5A5", "#FEE2E2", "#FECACA"], // Cowors red variants
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "pie" as const,
        height: 300,
      },
      labels: ["Stripe", "Razorpay", "PayPal", "Bank Transfer"],
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return Math.round(val) + "%";
        },
        style: {
          fontSize: "12px",
          fontWeight: "600",
          colors: ["#fff"],
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "0%",
          },
        },
      },
      legend: {
        position: "bottom" as const,
        fontSize: "12px",
        markers: {
          width: 8,
          height: 8,
          radius: 2,
        },
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: function (val: number) {
            return val + "%";
          },
        },
      },
    } as ApexOptions,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {/* Line Chart - Bookings Trend */}
      <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-gray-900">
        <div className="flex justify-between items-center px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Booking Trends
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {chartPeriod === "weekly" ? "Weekly" : "Daily"} booking performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setChartPeriod("weekly")}
                className={`px-3 py-1.5 text-xs font-medium rounded-l-lg transition-colors ${
                  chartPeriod === "weekly"
                    ? "bg-red-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartPeriod("daily")}
                className={`px-3 py-1.5 text-xs font-medium rounded-r-lg transition-colors ${
                  chartPeriod === "daily"
                    ? "bg-red-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Daily
              </button>
            </div>
            <div className="relative">
              <button onClick={toggleDropdown} className="dropdown-toggle">
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
              <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
                <DropdownItem
                  tag="a"
                  onItemClick={closeDropdown}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  Export Data
                </DropdownItem>
                <DropdownItem
                  tag="a"
                  onItemClick={closeDropdown}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  View Details
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <ReactApexChart
            options={bookingsLineData.options}
            series={bookingsLineData.series}
            type="line"
            height={300}
          />
        </div>
      </div>

      {/* Pie Chart - Payment Gateway Usage */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-gray-900">
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Payment Methods
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gateway usage distribution
          </p>
        </div>
        <div className="px-6 pb-6">
          <ReactApexChart
            options={paymentPieData.options}
            series={paymentPieData.series}
            type="pie"
            height={300}
          />
        </div>
      </div>

      {/* Bar Chart - Partner Type Performance */}
      <div className="xl:col-span-3 rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-gray-900">
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Partner Performance
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bookings and revenue by partner type
          </p>
        </div>
        <div className="px-6 pb-6">
          <ReactApexChart
            options={partnerBarData.options}
            series={partnerBarData.series}
            type="bar"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}