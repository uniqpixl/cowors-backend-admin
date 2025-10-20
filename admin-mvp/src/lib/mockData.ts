// Mock data utility for development when using mock authentication
import { DashboardKPIs, PlatformStats, BookingAnalytics, UserAnalytics, RevenueAnalytics, Activity } from '@/lib/api/types';

// Mock mode is disabled - always use real API data
export const isMockMode = (): boolean => {
  return false;
};

// Mock Dashboard KPIs (aligned with DashboardKPIs interface)
export const mockDashboardKPIs: DashboardKPIs = {
  totalUsers: 12450,
  totalPartners: 125,
  totalSpaces: 850,
  totalBookings: 8750,
  totalRevenue: 2450000,
  activeUsers: 8750,
  newUsersThisMonth: 1250,
  newPartnersThisMonth: 12,
  bookingsThisMonth: 875,
  revenueThisMonth: 245000,
  averageBookingValue: 280,
  platformCommission: 15
};

// Mock Platform Stats (aligned with PlatformStats interface)
export const mockPlatformStats: PlatformStats = {
  users: {
    total: 12450,
    active: 8750,
    new: 1250,
    verified: 9850
  },
  bookings: {
    total: 8750,
    pending: 250,
    confirmed: 0,
    completed: 7850,
    cancelled: 650
  },
  revenue: {
    total: 2450000,
    thisMonth: 245000,
    lastMonth: 210000,
    growth: 12.5
  },
  spaces: {
    total: 850,
    active: 765,
    inactive: 85
  },
  partners: {
    total: 125,
    active: 105,
    pending: 10
  }
};

// Mock Booking Analytics (aligned with BookingAnalytics interface)
export const mockBookingAnalytics: BookingAnalytics = {
  totalBookings: 8750,
  completedBookings: 7850,
  cancelledBookings: 650,
  averageBookingValue: 280,
  bookingsByStatus: {
    pending: 250,
    confirmed: 0,
    completed: 7850,
    cancelled: 650
  },
  bookingsByTimeRange: [
    { date: '2024-01-01', count: 45, revenue: 12600 },
    { date: '2024-01-02', count: 52, revenue: 14560 },
    { date: '2024-01-03', count: 38, revenue: 10640 },
    { date: '2024-01-04', count: 67, revenue: 18760 },
    { date: '2024-01-05', count: 73, revenue: 20440 },
    { date: '2024-01-06', count: 89, revenue: 24920 },
    { date: '2024-01-07', count: 95, revenue: 26600 }
  ]
};

// Mock User Analytics (aligned with UserAnalytics interface)
export const mockUserAnalytics: UserAnalytics = {
  totalUsers: 12450,
  activeUsers: 8750,
  newUsers: 1250,
  usersByRole: {
    user: 12400,
    admin: 50,
    superAdmin: 0
  },
  usersByStatus: {
    active: 9850,
    suspended: 250,
    banned: 150,
    pending: 200
  },
  userGrowthByTimeRange: [
    { date: '2024-01-01', count: 12000 },
    { date: '2024-01-02', count: 12050 },
    { date: '2024-01-03', count: 12100 },
    { date: '2024-01-04', count: 12200 },
    { date: '2024-01-05', count: 12300 },
    { date: '2024-01-06', count: 12400 },
    { date: '2024-01-07', count: 12450 }
  ]
};

// Mock Revenue Analytics (aligned with RevenueAnalytics interface)
export const mockRevenueAnalytics: RevenueAnalytics = {
  totalRevenue: 125000,
  monthlyRevenue: 15000,
  dailyRevenue: 500,
  averageOrderValue: 85,
  revenueByTimeRange: [
    { date: '2024-01-01', amount: 12000 },
    { date: '2024-02-01', amount: 13500 },
    { date: '2024-03-01', amount: 15000 }
  ],
  revenueBySource: {
    bookings: 100000,
    addOns: 20000,
    fees: 5000
  }
};

export const mockActivityFeed = [
  {
    id: '1',
    type: 'booking',
    title: 'New Booking Created',
    description: 'John Doe booked Conference Room A for 2 hours',
    message: 'New booking created by John Doe',
    timestamp: new Date().toISOString(),
    status: 'completed',
    user: 'John Doe',
    details: 'Conference Room A - 2 hours',
    amount: '$150.00',
    location: 'Conference Room A'
  },
  {
    id: '2',
    type: 'payout',
    title: 'Payment Received',
    description: 'Payment received from Jane Smith',
    message: 'Payment received from Jane Smith',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'completed',
    user: 'Jane Smith',
    details: '$150.00',
    amount: '$150.00'
  },
  {
    id: '3',
    type: 'partner',
    title: 'New User Registration',
    description: 'Mike Johnson registered with Premium membership',
    message: 'New user registration',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'pending',
    user: 'Mike Johnson',
    details: 'Premium membership'
  },
  {
    id: '4',
    type: 'booking',
    title: 'Booking Cancelled',
    description: 'Sarah Wilson cancelled Meeting Room B booking',
    message: 'Booking cancelled',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    status: 'completed',
    user: 'Sarah Wilson',
    details: 'Meeting Room B - Refund processed',
    amount: '$100.00',
    location: 'Meeting Room B'
  },
  {
    id: '5',
    type: 'ticket',
    title: 'New Review Submitted',
    description: 'David Brown submitted a 5-star review',
    message: 'New review submitted',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    status: 'new',
    user: 'David Brown',
    details: '5 stars - Excellent workspace'
  }
];

export const mockUserDashboard = {
  totalBookings: 45,
  activeBookings: 3,
  totalSpent: 2850,
  favoriteSpaces: 8,
  recentBookings: [
    {
      id: '1',
      spaceName: 'Conference Room A',
      date: '2024-01-15',
      time: '10:00 AM - 12:00 PM',
      status: 'confirmed'
    },
    {
      id: '2',
      spaceName: 'Hot Desk',
      date: '2024-01-14',
      time: '9:00 AM - 5:00 PM',
      status: 'completed'
    }
  ],
  upcomingBookings: [
    {
      id: '3',
      spaceName: 'Meeting Room B',
      date: '2024-01-20',
      time: '2:00 PM - 4:00 PM',
      status: 'confirmed'
    }
  ]
};

export const mockAdminUsers = {
  data: [
    {
      id: '1',
  email: 'admin@cowors.com',
      name: 'Test Admin',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'user',
      status: 'active',
      createdAt: '2024-01-05T00:00:00Z',
      lastLogin: '2024-01-14T15:20:00Z'
    },
    {
      id: '3',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      role: 'user',
      status: 'active',
      createdAt: '2024-01-10T00:00:00Z',
      lastLogin: '2024-01-13T09:45:00Z'
    }
  ],
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1
};

export const mockCategoryUsageAnalytics = [
  {
    categoryId: '1',
    categoryName: 'Coworking Spaces',
    totalBookings: 150,
    totalRevenue: 45000,
    conversionRate: 0.75,
    averageBookingValue: 300,
    subcategoriesCount: 5,
    partnersCount: 12
  },
  {
    categoryId: '2',
    categoryName: 'Meeting Rooms',
    totalBookings: 89,
    totalRevenue: 26700,
    conversionRate: 0.68,
    averageBookingValue: 300,
    subcategoriesCount: 3,
    partnersCount: 8
  },
  {
    categoryId: '3',
    categoryName: 'Event Spaces',
    totalBookings: 45,
    totalRevenue: 22500,
    conversionRate: 0.82,
    averageBookingValue: 500,
    subcategoriesCount: 4,
    partnersCount: 6
  }
];

export const mockCategoryPerformanceMetrics = [
  {
    categoryId: '1',
    categoryName: 'Coworking Spaces',
    subcategoriesCount: 5,
    partnersCount: 12,
    totalBookings: 150,
    totalRevenue: 45000,
    averageRating: 4.5,
    growthRate: 15.2
  },
  {
    categoryId: '2',
    categoryName: 'Meeting Rooms',
    subcategoriesCount: 3,
    partnersCount: 8,
    totalBookings: 89,
    totalRevenue: 26700,
    averageRating: 4.3,
    growthRate: 8.7
  },
  {
    categoryId: '3',
    categoryName: 'Event Spaces',
    subcategoriesCount: 4,
    partnersCount: 6,
    totalBookings: 45,
    totalRevenue: 22500,
    averageRating: 4.7,
    growthRate: 22.1
  }
];

export const mockBookings = {
  data: [
    {
      id: '1',
      userId: 'user-1',
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      spaceId: 'space-1',
      spaceName: 'Conference Room A',
      partnerId: 'partner-1',
      partnerName: 'WeWork Mumbai',
      startDate: '2024-01-15T10:00:00Z',
      endDate: '2024-01-15T12:00:00Z',
      status: 'confirmed',
      totalAmount: 150,
      paymentStatus: 'paid',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z'
    },
    {
      id: '2',
      userId: 'user-2',
      userName: 'Jane Smith',
      userEmail: 'jane.smith@example.com',
      spaceId: 'space-2',
      spaceName: 'Hot Desk',
      partnerId: 'partner-2',
      partnerName: 'Regus Delhi',
      startDate: '2024-01-16T09:00:00Z',
      endDate: '2024-01-16T17:00:00Z',
      status: 'confirmed',
      totalAmount: 80,
      paymentStatus: 'paid',
      createdAt: '2024-01-11T10:30:00Z',
      updatedAt: '2024-01-11T10:30:00Z'
    },
    {
      id: '3',
      userId: 'user-3',
      userName: 'Mike Johnson',
      userEmail: 'mike.johnson@example.com',
      spaceId: 'space-3',
      spaceName: 'Meeting Room B',
      partnerId: 'partner-1',
      partnerName: 'WeWork Mumbai',
      startDate: '2024-01-17T14:00:00Z',
      endDate: '2024-01-17T16:00:00Z',
      status: 'pending',
      totalAmount: 120,
      paymentStatus: 'pending',
      createdAt: '2024-01-12T11:15:00Z',
      updatedAt: '2024-01-12T11:15:00Z'
    }
  ],
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1
};

export const mockPartners = {
  data: [
    {
      id: 'CPT-123ABC',
      name: 'WeWork Mumbai',
      email: 'contact@wework-mumbai.com',
      phone: '+91-9876543210',
      businessName: 'WeWork India Pvt Ltd',
      businessType: 'Coworking Space',
      address: {
        street: '123 Business District',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      },
      status: 'active',
      verificationStatus: 'verified',
      totalSpaces: 15,
      totalBookings: 450,
      totalRevenue: 125000,
      rating: 4.8,
      joinedAt: '2023-06-15T00:00:00Z',
      lastActive: '2024-01-15T10:30:00Z',
      commission: 15,
      documents: {
        gst: 'verified',
        pan: 'verified',
        businessLicense: 'verified'
      }
    },
    {
      id: 'CPT-456DEF',
      name: 'Regus Delhi',
      email: 'delhi@regus.com',
      phone: '+91-9876543211',
      businessName: 'Regus Business Centers India',
      businessType: 'Office Space',
      address: {
        street: '456 Corporate Hub',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        zipCode: '110001'
      },
      status: 'active',
      verificationStatus: 'verified',
      totalSpaces: 25,
      totalBookings: 680,
      totalRevenue: 185000,
      rating: 4.6,
      joinedAt: '2023-04-20T00:00:00Z',
      lastActive: '2024-01-14T16:45:00Z',
      commission: 12,
      documents: {
        gst: 'verified',
        pan: 'verified',
        businessLicense: 'verified'
      }
    },
    {
      id: 'CPT-789GHI',
      name: 'CoworkIn Bangalore',
      email: 'info@coworkin-blr.com',
      phone: '+91-9876543212',
      businessName: 'CoworkIn Solutions Pvt Ltd',
      businessType: 'Coworking Space',
      address: {
        street: '789 Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560001'
      },
      status: 'pending',
      verificationStatus: 'pending',
      totalSpaces: 8,
      totalBookings: 120,
      totalRevenue: 35000,
      rating: 4.4,
      joinedAt: '2024-01-01T00:00:00Z',
      lastActive: '2024-01-13T12:20:00Z',
      commission: 18,
      documents: {
        gst: 'pending',
        pan: 'verified',
        businessLicense: 'pending'
      }
    },
    {
      id: 'CPT-101JKL',
      name: 'Spaces Chennai',
      email: 'chennai@spaces.com',
      phone: '+91-9876543213',
      businessName: 'Spaces India Operations',
      businessType: 'Restobar Space',
      address: {
        street: '321 IT Corridor',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        zipCode: '600001'
      },
      status: 'active',
      verificationStatus: 'verified',
      totalSpaces: 12,
      totalBookings: 320,
      totalRevenue: 95000,
      rating: 4.7,
      joinedAt: '2023-08-10T00:00:00Z',
      lastActive: '2024-01-15T09:15:00Z',
      commission: 14,
      documents: {
        gst: 'verified',
        pan: 'verified',
        businessLicense: 'verified'
      }
    },
    {
      id: 'CPT-202MNO',
      name: 'WorkHub Pune',
      email: 'pune@workhub.com',
      phone: '+91-9876543214',
      businessName: 'WorkHub Facilities Pvt Ltd',
      businessType: 'Event Space',
      address: {
        street: '654 Business Bay',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '411001'
      },
      status: 'suspended',
      verificationStatus: 'verified',
      totalSpaces: 6,
      totalBookings: 85,
      totalRevenue: 22000,
      rating: 4.2,
      joinedAt: '2023-11-05T00:00:00Z',
      lastActive: '2024-01-10T14:30:00Z',
      commission: 16,
      documents: {
        gst: 'verified',
        pan: 'verified',
        businessLicense: 'expired'
      }
    },
    {
      id: 'CPT-303PQR',
      name: 'Cafe Connect Hyderabad',
      email: 'connect@cafeconnect.com',
      phone: '+91-9876543215',
      businessName: 'Cafe Connect Pvt Ltd',
      businessType: 'Cafe Space',
      address: {
        street: '789 Tech City',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        zipCode: '500001'
      },
      status: 'active',
      verificationStatus: 'verified',
      totalSpaces: 8,
      totalBookings: 150,
      totalRevenue: 45000,
      rating: 4.5,
      joinedAt: '2023-09-15T00:00:00Z',
      lastActive: '2024-01-15T11:30:00Z',
      commission: 12,
      documents: {
        gst: 'verified',
        pan: 'verified',
        businessLicense: 'verified'
      }
    }
  ],
  total: 6,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
};



// Mock dashboard data combining all KPIs and stats
export const mockAdminSpaces = {
  data: [
    {
      id: 'space-1',
      name: 'Conference Room Alpha',
      description: 'Modern conference room with video conferencing facilities',
      spaceType: 'Meeting Room',
      status: 'Active',
      approvalStatus: 'approved',
      partner: {
        id: 'partner-1',
        name: 'WeWork Mumbai',
        businessName: 'WeWork India Pvt Ltd',
        email: 'contact@wework-mumbai.com',
        status: 'Active',
        verificationStatus: 'Verified'
      },
      location: {
        address: '123 Business District, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        coordinates: { lat: 19.0760, lng: 72.8777 }
      },
      pricing: {
        startingPrice: 150,
        hourlyRate: 150,
        currency: 'INR'
      },
      capacity: {
        total: 12,
        seating: 12
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Projector', icon: 'projector', available: true },
        { id: '3', name: 'Whiteboard', icon: 'whiteboard', available: true },
        { id: '4', name: 'AC', icon: 'ac', available: true }
      ],
      rating: {
        average: 4.8,
        totalReviews: 45
      },
      analytics: {
        totalBookings: 145,
        totalRevenue: 21750,
        averageRating: 4.8,
        utilizationRate: 78,
        lastBookingDate: '2024-01-14T16:00:00Z'
      },
      createdAt: '2023-06-15T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'space-2',
      name: 'Hot Desk Area',
      description: 'Flexible hot desk workspace in open area',
      spaceType: 'Coworking',
      status: 'Active',
      approvalStatus: 'approved',
      partner: {
        id: 'partner-2',
        name: 'Regus Delhi',
        businessName: 'Regus Business Centers India',
        email: 'delhi@regus.com',
        status: 'Active',
        verificationStatus: 'Verified'
      },
      location: {
        address: '456 Corporate Hub, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        coordinates: { lat: 28.6139, lng: 77.2090 }
      },
      pricing: {
        startingPrice: 25,
        hourlyRate: 25,
        currency: 'INR'
      },
      capacity: {
        total: 1,
        seating: 1
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Printing', icon: 'printer', available: true },
        { id: '3', name: 'Coffee', icon: 'coffee', available: true },
        { id: '4', name: 'Locker', icon: 'locker', available: true }
      ],
      rating: {
        average: 4.6,
        totalReviews: 32
      },
      analytics: {
        totalBookings: 89,
        totalRevenue: 13350,
        averageRating: 4.6,
        utilizationRate: 65,
        lastBookingDate: '2024-01-13T14:00:00Z'
      },
      createdAt: '2023-04-20T00:00:00Z',
      updatedAt: '2024-01-14T16:45:00Z'
    },
    {
      id: 'space-3',
      name: 'Event Hall Beta',
      description: 'Large event space for conferences and workshops',
      spaceType: 'Event Space',
      status: 'pending',
      approvalStatus: 'pending',
      partner: {
        id: 'partner-3',
        name: 'CoworkIn Bangalore',
        businessName: 'CoworkIn Solutions Pvt Ltd',
        email: 'info@coworkin-blr.com',
        status: 'Pending',
        verificationStatus: 'Pending'
      },
      location: {
        address: '789 Tech Park, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        coordinates: { lat: 12.9716, lng: 77.5946 }
      },
      pricing: {
        startingPrice: 500,
        hourlyRate: 500,
        currency: 'INR'
      },
      capacity: {
        total: 100,
        seating: 80,
        standing: 100
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Sound System', icon: 'sound', available: true },
        { id: '3', name: 'Stage', icon: 'stage', available: true },
        { id: '4', name: 'AC', icon: 'ac', available: true },
        { id: '5', name: 'Parking', icon: 'parking', available: true }
      ],
      rating: {
        average: 4.4,
        totalReviews: 8
      },
      analytics: {
        totalBookings: 12,
        totalRevenue: 42000,
        averageRating: 4.4,
        utilizationRate: 45,
        lastBookingDate: '2024-01-10T10:00:00Z'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-13T12:20:00Z'
    },
    {
      id: 'space-4',
      name: 'Private Office Suite',
      description: 'Fully furnished private office for teams',
      spaceType: 'Private Office',
      status: 'Active',
      approvalStatus: 'approved',
      partner: {
        id: 'partner-4',
        name: 'Spaces Chennai',
        businessName: 'Spaces India Operations',
        email: 'chennai@spaces.com',
        status: 'Active',
        verificationStatus: 'Verified'
      },
      location: {
        address: '321 IT Corridor, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        coordinates: { lat: 13.0827, lng: 80.2707 }
      },
      pricing: {
        startingPrice: 200,
        hourlyRate: 200,
        currency: 'INR'
      },
      capacity: {
        total: 8,
        seating: 8
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Furniture', icon: 'furniture', available: true },
        { id: '3', name: 'AC', icon: 'ac', available: true },
        { id: '4', name: 'Phone', icon: 'phone', available: true },
        { id: '5', name: 'Storage', icon: 'storage', available: true }
      ],
      rating: {
        average: 4.7,
        totalReviews: 28
      },
      analytics: {
        totalBookings: 67,
        totalRevenue: 80400,
        averageRating: 4.7,
        utilizationRate: 82,
        lastBookingDate: '2024-01-15T08:00:00Z'
      },
      createdAt: '2023-08-10T00:00:00Z',
      updatedAt: '2024-01-15T09:15:00Z'
    },
    {
      id: 'space-5',
      name: 'Meeting Pod Gamma',
      description: 'Small meeting pod for private discussions',
      spaceType: 'Meeting Room',
      status: 'Maintenance',
      approvalStatus: 'approved',
      partner: {
        id: 'partner-5',
        name: 'WorkHub Pune',
        businessName: 'WorkHub Facilities Pvt Ltd',
        email: 'pune@workhub.com',
        status: 'Suspended',
        verificationStatus: 'Verified'
      },
      location: {
        address: '654 Business Bay, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        coordinates: { lat: 18.5204, lng: 73.8567 }
      },
      pricing: {
        startingPrice: 75,
        hourlyRate: 75,
        currency: 'INR'
      },
      capacity: {
        total: 4,
        seating: 4
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'TV Screen', icon: 'tv', available: true },
        { id: '3', name: 'Whiteboard', icon: 'whiteboard', available: true },
        { id: '4', name: 'AC', icon: 'ac', available: true }
      ],
      rating: {
        average: 4.2,
        totalReviews: 15
      },
      analytics: {
        totalBookings: 34,
        totalRevenue: 15300,
        averageRating: 4.2,
        utilizationRate: 38,
        lastBookingDate: '2024-01-08T11:00:00Z'
      },
      createdAt: '2023-11-05T00:00:00Z',
      updatedAt: '2024-01-10T14:30:00Z'
    }
  ],
  total: 5,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
};

export const mockAdminSpaceStats = {
  totalSpaces: 850,
  activeSpaces: 720,
  pendingSpaces: 45,
  inactiveSpaces: 85,
  averageRating: 4.6,
  totalRevenue: 2450000,
  occupancyRate: 78.5,
  topCategories: [
    { category: 'Coworking', count: 340, percentage: 40 },
    { category: 'Meeting Rooms', count: 255, percentage: 30 },
    { category: 'Event Spaces', count: 170, percentage: 20 },
    { category: 'Private Offices', count: 85, percentage: 10 }
  ]
};

export const mockPendingSpaces = [
  {
    id: 'space-pending-1',
    name: 'Innovation Lab',
    partnerId: 'partner-3',
    partnerName: 'CoworkIn Bangalore',
    category: 'Workshop Space',
    submittedAt: '2024-01-12T10:00:00Z',
    status: 'Pending Review'
  },
  {
    id: 'space-pending-2',
    name: 'Executive Boardroom',
    partnerId: 'partner-6',
    partnerName: 'Premium Spaces Hyderabad',
    category: 'Meeting Room',
    submittedAt: '2024-01-11T14:30:00Z',
    status: 'Pending Review'
  }
];



export const mockSpaces = {
  data: [
    {
      id: 'space-1',
      name: 'Conference Room Alpha',
      description: 'Modern conference room with video conferencing facilities',
      spaceType: 'Meeting Room',
      type: 'Meeting Room',
      status: 'Active',
      location: {
        address: '123 Business District, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        coordinates: { lat: 19.0760, lng: 72.8777 }
      },
      city: 'Mumbai',
      pricing: {
        startingPrice: 150,
        hourlyRate: 150,
        currency: 'INR'
      },
      hourlyRate: 150,
      capacity: {
        total: 12,
        seating: 12
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Projector', icon: 'projector', available: true },
        { id: '3', name: 'Whiteboard', icon: 'whiteboard', available: true },
        { id: '4', name: 'AC', icon: 'ac', available: true }
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400' }
      ],
      rating: {
        average: 4.8,
        totalReviews: 45
      },
      createdAt: '2023-06-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'space-2',
      name: 'Hot Desk Area',
      description: 'Flexible hot desk workspace in open area',
      spaceType: 'Coworking',
      type: 'Coworking',
      status: 'Active',
      location: {
        address: '456 Corporate Hub, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        coordinates: { lat: 28.6139, lng: 77.2090 }
      },
      city: 'Delhi',
      pricing: {
        startingPrice: 25,
        hourlyRate: 25,
        currency: 'INR'
      },
      hourlyRate: 25,
      capacity: {
        total: 1,
        seating: 1
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Printing', icon: 'printer', available: true },
        { id: '3', name: 'Coffee', icon: 'coffee', available: true },
        { id: '4', name: 'Locker', icon: 'locker', available: true }
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400' }
      ],
      rating: {
        average: 4.6,
        totalReviews: 32
      },
      createdAt: '2023-04-20T00:00:00Z',
      updatedAt: '2024-01-14T16:45:00Z'
    },
    {
      id: 'space-3',
      name: 'Event Hall Beta',
      description: 'Large event space for conferences and workshops',
      spaceType: 'Event Space',
      type: 'Event Space',
      status: 'Active',
      location: {
        address: '789 Tech Park, Bangalore',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        coordinates: { lat: 12.9716, lng: 77.5946 }
      },
      city: 'Bangalore',
      pricing: {
        startingPrice: 500,
        hourlyRate: 500,
        currency: 'INR'
      },
      hourlyRate: 500,
      capacity: {
        total: 100,
        seating: 80
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Sound System', icon: 'sound', available: true },
        { id: '3', name: 'Stage', icon: 'stage', available: true },
        { id: '4', name: 'AC', icon: 'ac', available: true },
        { id: '5', name: 'Parking', icon: 'parking', available: true }
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400' }
      ],
      rating: {
        average: 4.4,
        totalReviews: 8
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-13T12:20:00Z'
    },
    {
      id: 'space-4',
      name: 'Private Office Suite',
      description: 'Fully furnished private office for teams',
      spaceType: 'Private Office',
      type: 'Private Office',
      status: 'Active',
      location: {
        address: '321 IT Corridor, Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        coordinates: { lat: 13.0827, lng: 80.2707 }
      },
      city: 'Chennai',
      pricing: {
        startingPrice: 200,
        hourlyRate: 200,
        currency: 'INR'
      },
      hourlyRate: 200,
      capacity: {
        total: 8,
        seating: 8
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'Furniture', icon: 'furniture', available: true },
        { id: '3', name: 'AC', icon: 'ac', available: true },
        { id: '4', name: 'Phone', icon: 'phone', available: true },
        { id: '5', name: 'Storage', icon: 'storage', available: true }
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400' }
      ],
      rating: {
        average: 4.7,
        totalReviews: 28
      },
      createdAt: '2023-08-10T00:00:00Z',
      updatedAt: '2024-01-15T09:15:00Z'
    },
    {
      id: 'space-5',
      name: 'Meeting Pod Gamma',
      description: 'Small meeting pod for private discussions',
      spaceType: 'Meeting Room',
      type: 'Meeting Room',
      status: 'Maintenance',
      location: {
        address: '654 Business Bay, Pune',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        coordinates: { lat: 18.5204, lng: 73.8567 }
      },
      city: 'Pune',
      pricing: {
        startingPrice: 75,
        hourlyRate: 75,
        currency: 'INR'
      },
      hourlyRate: 75,
      capacity: {
        total: 4,
        seating: 4
      },
      amenities: [
        { id: '1', name: 'WiFi', icon: 'wifi', available: true },
        { id: '2', name: 'TV Screen', icon: 'tv', available: true },
        { id: '3', name: 'Whiteboard', icon: 'whiteboard', available: true },
        { id: '4', name: 'AC', icon: 'ac', available: true }
      ],
      gallery: [
        { url: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=400' }
      ],
      rating: {
        average: 4.2,
        totalReviews: 15
      },
      createdAt: '2023-11-05T00:00:00Z',
      updatedAt: '2024-01-10T14:30:00Z'
    }
  ],
  total: 5,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
};

export const mockAdminDashboard = {
  kpis: mockDashboardKPIs,
  notifications: [
    { id: '1', title: 'New partner application', message: 'CoworkIn Hyderabad submitted application', type: 'info', timestamp: '2024-01-07T07:20:00Z' },
    { id: '2', title: 'Payment issue', message: 'Failed payment for booking #12345', type: 'warning', timestamp: '2024-01-07T06:15:00Z' },
    { id: '3', title: 'System maintenance', message: 'Scheduled maintenance tonight 2-4 AM', type: 'info', timestamp: '2024-01-06T20:00:00Z' }
  ],
  stats: {
    totalUsers: 12450,
    totalPartners: 125,
    totalSpaces: 850,
    totalBookings: 8750,
    totalRevenue: 2450000
  }
};