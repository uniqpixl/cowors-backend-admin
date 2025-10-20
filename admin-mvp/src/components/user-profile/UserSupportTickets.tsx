"use client";
import React from "react";
import { CalenderIcon, ChatIcon, BoxIcon, UserIcon, TimeIcon } from "@/icons";
import { IndianRupee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge, { StatusConfig } from "@/components/ui/status/StatusBadge";
import { Dispute, UserProfileComponentProps } from "@/types/user-profile";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UserSupportTicketsProps extends UserProfileComponentProps {}

const UserSupportTickets: React.FC<UserSupportTicketsProps> = ({}) => {
  const disputes: Dispute[] = [
    {
      id: "DSP-2024-001",
      type: "dispute",
      title: "Payment Dispute",
      description: "Unauthorized charge for cancelled booking",
      timestamp: "2 days ago",
      status: "open",
      amount: "₹150.00",
      service: "Private Office Rental",
      partner: "WeWork Central",
      priority: "high"
    },
    {
      id: "DSP-2024-002",
      type: "complaint",
      title: "Service Quality Issue",
      description: "WiFi connectivity problems during meeting",
      timestamp: "1 week ago",
      status: "resolved",
      service: "Meeting Room B",
      partner: "TechHub Spaces",
      priority: "medium"
    },
    {
      id: "DSP-2024-003",
      type: "refund",
      title: "Refund Request",
      description: "Equipment malfunction - projector not working",
      timestamp: "2 weeks ago",
      status: "pending",
      amount: "₹75.00",
      service: "Conference Room A",
      partner: "Innovation Center",
      priority: "medium"
    },
    {
      id: "DSP-2024-004",
      type: "escalation",
      title: "Escalated Complaint",
      description: "Unsatisfactory resolution from partner",
      timestamp: "3 weeks ago",
      status: "escalated",
      service: "Coworking Space",
      partner: "Creative Workspace",
      priority: "urgent"
    },
    {
      id: "DSP-2024-005",
      type: "dispute",
      title: "Billing Discrepancy",
      description: "Charged for additional hours not used",
      timestamp: "1 month ago",
      status: "closed",
      amount: "45.00",
      service: "Hot Desk",
      partner: "Startup Hub",
      priority: "low"
    }
  ];

  const getDisputeIcon = (type: string) => {
    const iconColor = getIconColor(type);
    switch (type) {
      case "dispute":
        return <ChatIcon className={`h-4 w-4 ${iconColor}`} />;
      case "complaint":
        return <BoxIcon className={`h-4 w-4 ${iconColor}`} />;
      case "refund":
        return <IndianRupee className={`h-4 w-4 ${iconColor}`} />;
      case "escalation":
        return <CalenderIcon className={`h-4 w-4 ${iconColor}`} />;
      default:
        return <UserIcon className={`h-4 w-4 ${iconColor}`} />;
    }
  };

  const SUPPORT_STATUS: Record<string, StatusConfig> = {
    resolved: { color: "success", label: "Resolved" },
    closed: { color: "success", label: "Closed" },
    pending: { color: "warning", label: "Pending" },
    open: { color: "info", label: "Open" },
    escalated: { color: "error", label: "Escalated" },
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "dispute":
        return "bg-red-100";
      case "complaint":
        return "bg-orange-100";
      case "refund":
        return "bg-brand-100";
      case "escalation":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "dispute":
        return "text-red-600";
      case "complaint":
        return "text-orange-600";
      case "refund":
        return "text-brand-600";
      case "escalation":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        <CardDescription>User support tickets and complaint timeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Total: {disputes.length}</span>
          <Button>View All</Button>
        </div>
        <div className="space-y-4">
        {disputes.map((dispute) => (
          <div
            key={dispute.id}
            className="flex items-start space-x-4 rounded-2xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getTypeColor(dispute.type)}`}>
              {getDisputeIcon(dispute.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-800">
                      {dispute.title}
                    </h4>
                    <Badge>{dispute.priority.charAt(0).toUpperCase() + dispute.priority.slice(1).toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {dispute.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <TimeIcon className="h-3 w-3" />
                      <span>{dispute.timestamp}</span>
                    </div>
                    {dispute.service && (
                      <div className="flex items-center space-x-1">
                        <BoxIcon className="h-3 w-3" />
                        <span>{dispute.service}</span>
                      </div>
                    )}
                    {dispute.partner && (
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>{dispute.partner}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <StatusBadge 
                    status={dispute.status}
                    customConfig={SUPPORT_STATUS}
                  />
                  {dispute.amount && (
                    <span className="text-sm text-gray-600">
                      Amount: ₹{dispute.amount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
        {disputes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No support tickets found for this user.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSupportTickets;