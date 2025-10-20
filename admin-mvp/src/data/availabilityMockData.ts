import { AvailabilitySlot, BookingData, CalendarEvent, AvailabilityPattern, AvailabilityOverride, AvailabilityStats, DaySchedule } from '@/types/availability';

// Mock availability patterns
const defaultDaySchedule: DaySchedule = {
  isAvailable: true,
  timeSlots: [
    { startTime: '09:00', endTime: '12:00', isAvailable: true, price: 25 },
    { startTime: '13:00', endTime: '17:00', isAvailable: true, price: 30 },
    { startTime: '18:00', endTime: '22:00', isAvailable: true, price: 35 }
  ]
};

export const mockAvailabilityPatterns: AvailabilityPattern[] = [
  {
    id: 'pattern-1',
    spaceId: 'space-1',
    weeklySchedule: {
      monday: defaultDaySchedule,
      tuesday: defaultDaySchedule,
      wednesday: defaultDaySchedule,
      thursday: defaultDaySchedule,
      friday: defaultDaySchedule,
      saturday: { ...defaultDaySchedule, timeSlots: [{ startTime: '10:00', endTime: '18:00', isAvailable: true, price: 40 }] },
      sunday: { isAvailable: false, timeSlots: [] }
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }
];

// Mock bookings
export const mockBookings: BookingData[] = [
  {
    id: 'booking-1',
    spaceId: 'space-1',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    startTime: new Date('2024-01-15T09:00:00'),
    endTime: new Date('2024-01-15T12:00:00'),
    status: 'confirmed',
    totalAmount: 75,
    createdAt: new Date('2024-01-10T10:00:00Z')
  },
  {
    id: 'booking-2',
    spaceId: 'space-1',
    userId: 'user-2',
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    startTime: new Date('2024-01-16T13:00:00'),
    endTime: new Date('2024-01-16T17:00:00'),
    status: 'confirmed',
    totalAmount: 120,
    createdAt: new Date('2024-01-11T14:30:00Z')
  },
  {
    id: 'booking-3',
    spaceId: 'space-1',
    userId: 'user-3',
    userName: 'Bob Johnson',
    userEmail: 'bob@example.com',
    startTime: new Date('2024-01-17T18:00:00'),
    endTime: new Date('2024-01-17T22:00:00'),
    status: 'pending',
    totalAmount: 140,
    createdAt: new Date('2024-01-12T09:15:00Z')
  }
];

// Mock availability overrides
export const mockAvailabilityOverrides: AvailabilityOverride[] = [
  {
    id: 'override-1',
    spaceId: 'space-1',
    date: new Date('2024-01-21'),
    isAvailable: false,
    reason: 'Maintenance scheduled',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-15T10:00:00')
  },
  {
    id: 'override-2',
    spaceId: 'space-1',
    date: new Date('2024-01-27'),
    isAvailable: false,
    reason: 'Private event',
    createdBy: 'admin-1',
    createdAt: new Date('2024-01-18T14:30:00')
  }
];

// Mock availability stats
export const mockAvailabilityStats: AvailabilityStats = {
  spaceId: 'space-1',
  totalBookings: 45,
  confirmedBookings: 38,
  pendingBookings: 5,
  cancelledBookings: 2,
  totalRevenue: 3250,
  occupancyRate: 0.68,
  averageBookingDuration: 3.2,
  peakHours: ['14:00', '15:00', '16:00'],
  popularDays: ['Monday', 'Wednesday', 'Friday'],
  period: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  }
};

// Helper function to generate calendar events from bookings and overrides
export const generateCalendarEvents = (bookings: BookingData[], overrides: AvailabilityOverride[]): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  // Convert bookings to calendar events
  bookings.forEach(booking => {
    events.push({
      id: `booking-${booking.id}`,
      title: `${booking.userName} - ${booking.status}`,
      start: booking.startTime,
      end: booking.endTime,
      type: 'booking',
      status: booking.status,
      backgroundColor: booking.status === 'confirmed' ? '#10b981' : booking.status === 'pending' ? '#f59e0b' : '#ef4444',
      borderColor: booking.status === 'confirmed' ? '#059669' : booking.status === 'pending' ? '#d97706' : '#dc2626',
      textColor: '#ffffff',
      amount: booking.totalAmount,
      extendedProps: {
        booking,
        userName: booking.userName,
        userEmail: booking.userEmail
      }
    });
  });

  // Convert overrides to calendar events
  overrides.forEach(override => {
    if (!override.isAvailable) {
      const startOfDay = new Date(override.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(override.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      events.push({
        id: `override-${override.id}`,
        title: override.reason || 'Blocked',
        start: startOfDay,
        end: endOfDay,
        type: 'blocked',
        allDay: true,
        backgroundColor: '#6b7280',
        borderColor: '#4b5563',
        textColor: '#ffffff',
        extendedProps: {
          override,
          reason: override.reason
        }
      });
    }
  });

  return events;
};

// Helper function to get availability for a specific date
export const getAvailabilityForDate = (spaceId: string, date: Date): AvailabilitySlot[] => {
  const pattern = mockAvailabilityPatterns.find(p => p.spaceId === spaceId);
  if (!pattern) return [];
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof pattern.weeklySchedule;
  const dayAvailability = pattern.weeklySchedule[dayName];
  
  if (!dayAvailability?.isAvailable) return [];
  
  // Check for overrides
  const override = mockAvailabilityOverrides.find(o => 
    o.spaceId === spaceId && 
    o.date.toDateString() === date.toDateString()
  );
  
  if (override && !override.isAvailable) return [];
  
  return dayAvailability.timeSlots;
};

// Helper function to check if a time slot is booked
export const isTimeSlotBooked = (spaceId: string, date: Date, startTime: string, endTime: string): boolean => {
  const spaceBookings = mockBookings.filter(booking => 
    booking.spaceId === spaceId && 
    booking.startTime.toDateString() === date.toDateString()
  );
  
  const slotStart = new Date(`${date.toDateString()} ${startTime}`);
  const slotEnd = new Date(`${date.toDateString()} ${endTime}`);
  
  return spaceBookings.some(booking => {
    return (slotStart < booking.endTime && slotEnd > booking.startTime);
  });
};