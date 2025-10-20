export interface AvailabilitySlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  price?: number;
}

export interface DaySchedule {
  isAvailable: boolean;
  timeSlots: AvailabilitySlot[];
}

export interface BookingData {
  id: string;
  spaceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'booking' | 'blocked' | 'maintenance';
  status?: 'confirmed' | 'pending' | 'cancelled';
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  amount?: number;
  extendedProps?: Record<string, unknown>;
}

export interface AvailabilityPattern {
  id: string;
  spaceId: string;
  weeklySchedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityOverride {
  id: string;
  spaceId: string;
  date: Date;
  isAvailable: boolean;
  reason?: string;
  createdBy: string;
  createdAt: Date;
}

export interface AvailabilityStats {
  spaceId: string;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  averageBookingDuration: number;
  peakHours: string[];
  popularDays: string[];
  period: {
    start: Date;
    end: Date;
  };
}

export interface CalendarViewProps {
  spaceId: string;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceName: string;
}

export interface AdminControlsProps {
  spaceId: string;
  selectedDate?: Date;
  overrides: AvailabilityOverride[];
  onOverrideAvailability: (override: Omit<AvailabilityOverride, 'id' | 'createdAt'>) => void;
  onBlockDate: (date: Date, reason: string) => void;
  onUnblockDate: (date: Date) => void;
}