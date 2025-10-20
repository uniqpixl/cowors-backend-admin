import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock GST data for demonstration
    const gstData = {
      metrics: [
        {
          id: 1,
          title: "Total GST Collected",
          value: "₹4,56,780",
          icon: "IndianRupee",
          change: "+18.5%",
          changeType: "increase",
          description: "vs last month"
        },
        {
          id: 2,
          title: "GST Rate",
          value: "18%",
          icon: "Percent",
          change: "0%",
          changeType: "neutral",
          description: "standard rate"
        },
        {
          id: 3,
          title: "Transactions",
          value: "2,567",
          icon: "FileText",
          change: "+89",
          changeType: "increase",
          description: "vs last month"
        },
        {
          id: 4,
          title: "Pending Filing",
          value: "₹67,890",
          icon: "AlertCircle",
          change: "-12.1%",
          changeType: "decrease",
          description: "vs last month"
        },
        {
          id: 5,
          title: "Growth",
          value: "+16.4%",
          icon: "TrendingUp",
          change: "+4.7%",
          changeType: "increase",
          description: "vs last quarter"
        },
        {
          id: 6,
          title: "Compliance Rate",
          value: "98.5%",
          icon: "CheckCircle",
          change: "+1.2%",
          changeType: "increase",
          description: "vs last month"
        }
      ],
      ledgerEntries: [
        {
          id: 1,
          date: "2024-01-15",
          description: "GST on Coworking Space Booking",
          bookingId: "BK-789012",
          customerId: "CUS-DP45W7",
          amount: 4560,
          gstAmount: 820.8,
          status: "collected",
          type: "output_tax"
        },
        {
          id: 2,
          date: "2024-01-14",
          description: "GST on Event Space Rental",
          bookingId: "BK-789013",
          customerId: "CUS-K8M3N9",
          amount: 12000,
          gstAmount: 2160,
          status: "collected",
          type: "output_tax"
        },
        {
          id: 3,
          date: "2024-01-13",
          description: "GST on Office Space Booking",
          bookingId: "BK-789014",
          customerId: "CUS-R7Q2X5",
          amount: 8500,
          gstAmount: 1530,
          status: "pending",
          type: "output_tax"
        },
        {
          id: 4,
          date: "2024-01-12",
          description: "Input GST on Equipment Purchase",
          invoiceId: "INV-567890",
          vendorId: "VEN-123456",
          amount: 25000,
          gstAmount: 4500,
          status: "claimed",
          type: "input_tax"
        },
        {
          id: 5,
          date: "2024-01-11",
          description: "GST on Cafe Services",
          bookingId: "BK-789015",
          customerId: "CUS-B9F4T6",
          amount: 2300,
          gstAmount: 414,
          status: "collected",
          type: "output_tax"
        }
      ],
      summary: {
        totalGSTCollected: 456780,
        totalGSTPaid: 89450,
        netGSTLiability: 367330,
        complianceStatus: "compliant",
        nextFilingDate: "2024-02-20",
        lastFiledDate: "2024-01-20"
      }
    };

    return NextResponse.json(gstData);
  } catch (error) {
    console.error('Error fetching GST data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GST data' },
      { status: 500 }
    );
  }
}