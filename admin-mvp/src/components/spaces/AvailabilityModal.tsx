"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityAdminControls from "./AvailabilityAdminControls";
import {
  AvailabilityModalProps,
  AvailabilityOverride,
  CalendarEvent,
} from "@/types/availability";
import { useSpaceBookings, useSpaceAnalytics } from '@/hooks/useSpaces';
import { Calendar, Clock, Users, X, BarChart3, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/button/Button';



const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  spaceId,
  spaceName,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics'>('calendar');
  
  // Use real API hooks
  const { data: bookingsData, isLoading: bookingsLoading } = useSpaceBookings(spaceId, {
    enabled: isOpen && !!spaceId
  });
  const { data: analyticsData, isLoading: analyticsLoading } = useSpaceAnalytics(spaceId, {
    enabled: isOpen && !!spaceId
  });
  
  const loading = bookingsLoading || analyticsLoading;

  // Process real API data into calendar events
  useEffect(() => {
    if (bookingsData?.data) {
      // Transform booking data into calendar events
      const calendarEvents: CalendarEvent[] = bookingsData.data.map((booking: any) => ({
        id: booking.id,
        title: `Booking - ${booking.user?.name || 'Unknown User'}`,
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
        type: 'booking' as const,
        status: booking.status,
        amount: booking.totalAmount,
        userId: booking.userId,
        userName: booking.user?.name || 'Unknown User',
        userEmail: booking.user?.email || '',
        spaceId: booking.spaceId
      }));
      setEvents(calendarEvents);
    } else {
      setEvents([]);
    }
  }, [bookingsData]);

  // Initialize empty overrides (would be fetched from API in real implementation)
  useEffect(() => {
    setOverrides([]);
  }, [spaceId]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Handle event click - could open event details modal
    console.log('Event clicked:', event);
  };

  const handleOverrideAvailability = (override: Omit<AvailabilityOverride, 'id' | 'createdAt'>) => {
    // Handle availability override
    console.log('Override availability:', override);
    
    // Add to overrides list
    const newOverride: AvailabilityOverride = {
      ...override,
      id: `override-${Date.now()}`,
      createdAt: new Date()
    };
    setOverrides(prev => [...prev, newOverride]);
  };

  const handleBlockDate = (date: Date, reason: string) => {
    // Handle date blocking
    console.log('Block date:', date, reason);
    
    const newOverride: AvailabilityOverride = {
      id: `block-${Date.now()}`,
      spaceId,
      date,
      isAvailable: false,
      reason,
      createdBy: 'admin',
      createdAt: new Date()
    };
    setOverrides(prev => [...prev, newOverride]);
  };

  const handleUnblockDate = (date: Date) => {
    // Handle date unblocking
    console.log('Unblock date:', date);
    
    // Remove override for this date
    setOverrides(prev => prev.filter(override => 
      override.date.toDateString() !== date.toDateString()
    ));
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="p-6 lg:p-8 max-w-6xl">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading availability data...</span>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="p-6 lg:p-8 max-w-7xl">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Manage Availability
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {spaceName} - Space ID: {spaceId}
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-700 ${
                activeTab === 'analytics'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'calendar' ? (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
              {/* Calendar */}
              <div className="xl:col-span-3 overflow-y-auto">
                <AvailabilityCalendar
                  events={events}
                  onDateSelect={handleDateSelect}
                  onEventClick={handleEventClick}
                />
              </div>
              
              {/* Admin Controls */}
              <div className="xl:col-span-1 overflow-y-auto">
                <AvailabilityAdminControls
                  spaceId={spaceId}
                  selectedDate={selectedDate}
                  overrides={overrides}
                  onOverrideAvailability={handleOverrideAvailability}
                  onBlockDate={handleBlockDate}
                  onUnblockDate={handleUnblockDate}
                />
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto">
              <AvailabilityAnalytics stats={analyticsData} events={events} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Analytics component
interface AvailabilityAnalyticsProps {
  stats: any; // Real analytics data from API
  events: CalendarEvent[];
}

const AvailabilityAnalytics: React.FC<AvailabilityAnalyticsProps> = ({ stats, events }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 dark:text-gray-400">No analytics data available</span>
      </div>
    );
  }
  
  // Create stats object with default values if API data is missing fields
  const analyticsStats = {
    totalBookings: stats.totalBookings || 0,
    totalRevenue: stats.totalRevenue || 0,
    occupancyRate: stats.occupancyRate || 0,
    averageBookingDuration: stats.averageBookingDuration || 0,
    peakHours: stats.peakHours || [],
    popularDays: stats.popularDays || []
  };

  const recentBookings = (events || [])
    .filter(e => e.type === 'booking' && e.status === 'confirmed')
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {analyticsStats.totalBookings}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
            ₹{analyticsStats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {analyticsStats.occupancyRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Occupancy Rate</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {analyticsStats.averageBookingDuration}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
        </div>
      </div>

      {/* Peak Hours & Popular Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
            Peak Hours
          </h3>
          <div className="space-y-2">
            {(analyticsStats.peakHours || []).map((hour: string, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{hour}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-brand-500 h-2 rounded-full" 
                    style={{ width: `${80 - index * 15}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!analyticsStats.peakHours || analyticsStats.peakHours.length === 0) && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No peak hours data available
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
            Popular Days
          </h3>
          <div className="space-y-2">
            {(analyticsStats.popularDays || []).map((day: string, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">{day}</span>
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${90 - index * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {(!analyticsStats.popularDays || analyticsStats.popularDays.length === 0) && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                No popular days data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
          Recent Bookings
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Customer</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Time</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Amount</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length > 0 ? (
                recentBookings.map((event) => (
                  <tr key={event.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-800 dark:text-white/90">{event.title}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{new Date(event.start).toLocaleDateString()}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">
                      {new Date(event.start).toLocaleTimeString()} - {new Date(event.end).toLocaleTimeString()}
                    </td>
                    <td className="py-2 text-gray-800 dark:text-white/90">₹{event.amount || 0}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'confirmed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : event.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No recent bookings available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;