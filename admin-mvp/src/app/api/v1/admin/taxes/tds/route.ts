import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock TDS data for demonstration
    const tdsData = {
      metrics: [
        {
          id: 1,
          title: "Total TDS Deducted",
          value: "₹1,85,670",
          icon: "IndianRupee",
          change: "+12.5%",
          changeType: "increase",
          description: "vs last month"
        },
        {
          id: 2,
          title: "TDS Rate",
          value: "10%",
          icon: "Percent",
          change: "0%",
          changeType: "neutral",
          description: "standard rate"
        },
        {
          id: 3,
          title: "Transactions",
          value: "856",
          icon: "FileText",
          change: "+23",
          changeType: "increase",
          description: "vs last month"
        },
        {
          id: 4,
          title: "Pending Deposit",
          value: "₹32,450",
          icon: "AlertCircle",
          change: "-5.2%",
          changeType: "decrease",
          description: "vs last month"
        },
        {
          id: 5,
          title: "Growth",
          value: "+8.3%",
          icon: "TrendingUp",
          change: "+2.1%",
          changeType: "increase",
          description: "vs last quarter"
        },
        {
          id: 6,
          title: "Affected Partners",
          value: "124",
          icon: "Building",
          change: "+8",
          changeType: "increase",
          description: "vs last month"
        }
      ],
      ledgerEntries: [
        {
          id: 1,
          date: "2024-01-15",
          transactionId: "TXN-002234",
          partnerName: "WorkSpace Solutions",
          amount: 85000,
          tdsAmount: 8500,
          status: "deducted",
          description: "Monthly payout"
        },
        {
          id: 2,
          date: "2024-01-14",
          transactionId: "TXN-002233",
          partnerName: "Event Masters",
          amount: 65000,
          tdsAmount: 6500,
          status: "deducted",
          description: "Event space commission"
        },
        {
          id: 3,
          date: "2024-01-13",
          transactionId: "TXN-002232",
          partnerName: "Office Hub",
          amount: 120000,
          tdsAmount: 12000,
          status: "pending",
          description: "Office space commission"
        }
      ],
      summary: {
        totalDeducted: 185670,
        totalPending: 32450,
        totalTransactions: 856,
        averageDeductionValue: 216.86,
        complianceRate: 99.2
      }
    };

    return NextResponse.json(tdsData);
  } catch (error) {
    console.error('TDS API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TDS data' },
      { status: 500 }
    );
  }
}