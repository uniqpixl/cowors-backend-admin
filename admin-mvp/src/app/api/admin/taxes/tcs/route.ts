import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock TCS data for demonstration
    const tcsData = {
      metrics: [
        {
          id: 1,
          title: "Total TCS Collected",
          value: "₹2,45,890",
          icon: "IndianRupee",
          change: "+15.2%",
          changeType: "increase",
          description: "vs last month"
        },
        {
          id: 2,
          title: "TCS Rate",
          value: "1%",
          icon: "Percent",
          change: "0%",
          changeType: "neutral",
          description: "standard rate"
        },
        {
          id: 3,
          title: "Transactions",
          value: "1,234",
          icon: "FileText",
          change: "+45",
          changeType: "increase",
          description: "vs last month"
        },
        {
          id: 4,
          title: "Pending Remittance",
          value: "₹45,670",
          icon: "AlertCircle",
          change: "-8.3%",
          changeType: "decrease",
          description: "vs last month"
        },
        {
          id: 5,
          title: "Growth",
          value: "+12.7%",
          icon: "TrendingUp",
          change: "+3.2%",
          changeType: "increase",
          description: "vs last quarter"
        },
        {
          id: 6,
          title: "Affected Users",
          value: "567",
          icon: "Users",
          change: "+23",
          changeType: "increase",
          description: "vs last month"
        }
      ],
      ledgerEntries: [
        {
          id: 1,
          date: "2024-01-15",
          transactionId: "TXN-001234",
          customerName: "John Doe",
          amount: 50000,
          tcsAmount: 500,
          status: "collected",
          description: "Coworking space booking"
        },
        {
          id: 2,
          date: "2024-01-14",
          transactionId: "TXN-001233",
          customerName: "Jane Smith",
          amount: 75000,
          tcsAmount: 750,
          status: "collected",
          description: "Event space booking"
        },
        {
          id: 3,
          date: "2024-01-13",
          transactionId: "TXN-001232",
          customerName: "ABC Corp",
          amount: 120000,
          tcsAmount: 1200,
          status: "pending",
          description: "Office space booking"
        }
      ],
      summary: {
        totalCollected: 245890,
        totalPending: 45670,
        totalTransactions: 1234,
        averageTransactionValue: 199.43,
        complianceRate: 98.5
      }
    };

    return NextResponse.json(tcsData);
  } catch (error) {
    console.error('TCS API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TCS data' },
      { status: 500 }
    );
  }
}