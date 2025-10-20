"use client";

import React from "react";
import { Clock, CheckCircle, Calendar, CreditCard, MapPin } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: 'transaction_created' | 'payment_processed' | 'space_reserved' | 'transaction_confirmed';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
}

export function TransactionTimeline() {
  const mockTimelineData: TimelineEvent[] = [
    {
      id: '1',
      type: 'transaction_created',
      title: 'Transaction Created',
      description: 'New transaction request submitted by customer',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'Rajesh Kumar',
      ipAddress: '192.168.1.105',
      device: 'iPhone 14 Pro (iOS 17.2)',
      browser: 'Safari 17.2'
    },
    {
      id: '2',
      type: 'payment_processed',
      title: 'Payment Processed',
      description: 'Payment of ₹2,500 processed successfully via UPI',
      timestamp: '2024-01-15T10:35:00Z',
      user: 'System',
      ipAddress: '192.168.1.105',
      device: 'iPhone 14 Pro (iOS 17.2)',
      browser: 'Safari 17.2'
    },
    {
      id: '3',
      type: 'space_reserved',
      title: 'Space Reserved',
      description: 'Hot desk space reserved at WeWork BKC',
      timestamp: '2024-01-15T10:36:00Z',
      user: 'System'
    },
    {
      id: '4',
      type: 'transaction_confirmed',
      title: 'Transaction Confirmed',
      description: 'Customer payment received and transaction confirmed',
      timestamp: '2024-01-15T10:37:00Z',
      user: 'Admin User',
      ipAddress: '10.0.0.45',
      device: 'MacBook Pro (macOS 14.2)',
      browser: 'Chrome 120.0'
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'transaction_created':
        return <Calendar className="h-4 w-4" />;
      case 'payment_processed':
        return <CreditCard className="h-4 w-4" />;
      case 'space_reserved':
        return <MapPin className="h-4 w-4" />;
      case 'transaction_confirmed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  /*const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'transaction_created':
        return 'bg-red-600';
      case 'payment_processed':
        return 'bg-green-500';
      case 'space_reserved':
        return 'bg-purple-500';
      case 'transaction_confirmed':
        return 'bg-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };*/ // Not currently used but kept for future implementation

  const getEventStyles = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "transaction_created":
        return {
          bg: "bg-red-100 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          icon: "text-red-600 dark:text-red-400",
          dot: "bg-red-600"
        };
      case "payment_processed":
        return {
          bg: "bg-green-100 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          icon: "text-green-600 dark:text-green-400",
          dot: "bg-green-500"
        };
      case "space_reserved":
        return {
          bg: "bg-purple-100 dark:bg-purple-900/20",
          border: "border-purple-200 dark:border-purple-800",
          icon: "text-purple-600 dark:text-purple-400",
          dot: "bg-purple-500"
        };
      default:
        return {
          bg: "bg-emerald-100 dark:bg-emerald-900/20",
          border: "border-emerald-200 dark:border-emerald-800",
          icon: "text-emerald-600 dark:text-emerald-400",
          dot: "bg-emerald-500"
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    };
  };

  // Sort events by timestamp (newest first)
  const sortedEvents = [...mockTimelineData].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          Transaction Timeline
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track all activities and changes for this transaction
        </p>
      </div>
      <div className="p-6.5">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 h-full w-0.5 bg-stroke dark:bg-strokedark"></div>
          
          <div className="space-y-6">
            {sortedEvents.map((event) => {
              const styles = getEventStyles(event.type);
              const { date, time } = formatTimestamp(event.timestamp);
              
              return (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${styles.border} ${styles.bg}`}>
                    <div className={styles.icon}>
                      {getEventIcon(event.type)}
                    </div>
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-black dark:text-white">
                          {event.title}
                        </h4>
                        <p className="mt-1 text-sm text-body dark:text-bodydark">
                          {event.description}
                        </p>
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">By: {event.user}</span>
                          {event.ipAddress && (
                            <>
                              <span className="mx-2">•</span>
                              <span>IP: {event.ipAddress}</span>
                            </>
                          )}
                          {event.device && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Device: {event.device}</span>
                            </>
                          )}
                          {event.browser && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Browser: {event.browser}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-black dark:text-white">
                          {date}
                        </p>
                        <p className="text-xs text-body dark:text-bodydark">
                          {time}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* View all button */}
        <div className="mt-8 border-t border-stroke pt-4 dark:border-strokedark">
          <button className="group w-full rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 py-3 text-sm font-semibold text-red-700 transition-all duration-200 hover:from-red-100 hover:to-red-200 hover:shadow-md dark:border-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 dark:hover:from-red-800/40 dark:hover:to-red-700/40">
            <span className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 group-hover:scale-110 transition-transform" />
              View Complete History
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}