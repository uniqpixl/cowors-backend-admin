// Partner mock data for admin dashboard

export interface PartnerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  logo?: string;
  status: 'active' | 'inactive' | 'suspended';
  isVerified: boolean;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  location?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
    designation: string;
  };
  businessType?: string;
  totalSpaces?: number;
  totalBookings?: number;
  totalRevenue?: number;
  rating?: number;
  reviewCount?: number;
}

export interface PartnerBusinessInfo {
  gst: {
    number: string;
    status: 'verified' | 'pending' | 'expired';
    verifiedAt?: string;
  };
  fssai: {
    licenseNumber: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
  };
  certifications: {
    id: string;
    type: string;
    number: string;
    status: 'valid' | 'pending' | 'expired';
    expiryDate?: string;
  }[];
  payoutMethods: {
    id: string;
    type: 'bank' | 'upi' | 'wallet';
    details: string;
    isDefault: boolean;
    status: 'active' | 'inactive';
  }[];
  businessRegistration: {
    type: string;
    number: string;
    registeredAt: string;
  };
}

export interface PartnerFinancialData {
  partnerId: string;
  totalBookingsRevenue: number;
  commissionRate: number;
  commissionPaid: number;
  partnerRevenue: number;
  walletBalance: number;
  totalBookings: number;
  spaceRating: number;
  totalReviews: number;
  monthlyGrowth: {
    bookings: string;
    revenue: string;
    rating: string;
    reviews: string;
    walletBalance: string;
  };
}

// Mock financial data for Third Wave Coffee partner
export const mockPartnerFinancialData: PartnerFinancialData = {
  partnerId: "partner-thirdwave-001",
  totalBookingsRevenue: 845000, // Total revenue from all bookings
  commissionRate: 15, // 15% commission rate
  commissionPaid: 126750, // 15% of total revenue
  partnerRevenue: 718250, // Revenue after commission deduction
  walletBalance: 45320, // Current available funds in wallet
  totalBookings: 156,
  spaceRating: 4.6,
  totalReviews: 89,
  monthlyGrowth: {
    bookings: "+24%",
    revenue: "+15%",
    rating: "+0.3",
    reviews: "+12",
    walletBalance: "+₹12,500"
  }
};

// Helper function to format currency
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Helper function to calculate commission
export const calculateCommission = (revenue: number, rate: number): number => {
  return Math.round(revenue * (rate / 100));
};

// Helper function to calculate partner revenue after commission
export const calculatePartnerRevenue = (totalRevenue: number, commission: number): number => {
  return totalRevenue - commission;
};

// Mock business information for Third Wave Coffee partner
export const mockPartnerBusinessInfo: PartnerBusinessInfo = {
  gst: {
    number: "29ABCDE1234F1Z5",
    status: "verified",
    verifiedAt: "2024-01-15T10:30:00Z"
  },
  fssai: {
    licenseNumber: "12345678901234",
    expiryDate: "2025-12-31",
    status: "valid"
  },
  certifications: [
    {
      id: "cert-1",
      type: "Fire Safety Certificate",
      number: "FS/2024/001",
      status: "valid",
      expiryDate: "2025-06-30"
    },
    {
      id: "cert-2",
      type: "Trade License",
      number: "TL/BLR/2024/456",
      status: "valid",
      expiryDate: "2025-03-31"
    },
    {
      id: "cert-3",
      type: "Health License",
      number: "HL/KA/2024/789",
      status: "pending"
    }
  ],
  payoutMethods: [
    {
      id: "payout-1",
      type: "bank",
      details: "HDFC Bank - ****1234",
      isDefault: true,
      status: "active"
    },
    {
      id: "payout-2",
      type: "upi",
      details: "partner@paytm",
      isDefault: false,
      status: "active"
    }
  ],
  businessRegistration: {
    type: "Private Limited Company",
    number: "U74999KA2020PTC134567",
    registeredAt: "2020-08-15T00:00:00Z"
  }
};

// Helper function to get status color
export const getStatusColor = (status: string): 'primary' | 'success' | 'error' | 'warning' | 'info' | 'light' | 'dark' => {
  switch (status) {
    case 'verified':
    case 'valid':
    case 'active':
      return 'success';
    case 'pending':
    case 'expiring':
      return 'warning';
    case 'expired':
    case 'inactive':
      return 'error';
    default:
      return 'light';
  }
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Mock partner data for Third Wave Coffee (from PartnerMetaCardAdmin)
export const mockPartnerData: PartnerData = {
  id: 'partner-twc-001',
  name: 'Third Wave Coffee',
  email: 'contact@thirdwavecoffee.com',
  phone: '+91-98765-43210',
  website: 'https://thirdwavecoffee.com',
  description: 'Premium coffee roasters and workspace provider',
  logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20coffee%20shop%20logo%20with%20wave%20design&image_size=square',
  status: 'active',
  isVerified: true,
  verificationStatus: 'verified',
  subscriptionPlan: 'Premium',
  subscriptionStatus: 'active',
  createdAt: '2023-11-15T10:00:00Z',
  updatedAt: '2024-01-10T14:30:00Z',
  approvedAt: '2023-11-20T16:45:00Z',
  location: {
    street: '123 Coffee Street',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560001',
    country: 'IN'
  },
  contactPerson: {
    name: 'Rajesh Kumar',
    email: 'rajesh@thirdwavecoffee.com',
    phone: '+91-98765-43210',
    designation: 'Operations Manager'
  },
  businessType: 'Coffee Shop & Coworking',
  totalSpaces: 25,
  totalBookings: 450,
  totalRevenue: 125000.00,
  rating: 4.8,
  reviewCount: 156
};

// Additional mock partners for testing
export const mockPartners: PartnerData[] = [
  mockPartnerData,
  {
    id: 'partner-workspace-002',
    name: 'Urban Workspace Hub',
    email: 'info@urbanworkspace.com',
    phone: '+91-87654-32109',
    website: 'https://urbanworkspace.com',
    description: 'Modern coworking spaces for professionals',
    logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20office%20building%20logo&image_size=square',
    status: 'active',
    isVerified: false,
    verificationStatus: 'pending',
    subscriptionPlan: 'Standard',
    subscriptionStatus: 'active',
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-12T11:20:00Z',
    location: {
      street: '456 Business District',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'IN'
    },
    contactPerson: {
      name: 'Priya Sharma',
      email: 'priya@urbanworkspace.com',
      phone: '+91-87654-32109',
      designation: 'Business Development Manager'
    },
    businessType: 'Coworking Space',
    totalSpaces: 40,
    totalBookings: 280,
    totalRevenue: 85000.00,
    rating: 4.2,
    reviewCount: 89
  },
  {
    id: 'partner-cafe-003',
    name: 'Brew & Work Cafe',
    email: 'hello@brewandwork.com',
    phone: '+91-76543-21098',
    website: 'https://brewandwork.com',
    description: 'Artisan coffee with productive workspace',
    logo: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=artisan%20coffee%20cafe%20logo&image_size=square',
    status: 'inactive',
    isVerified: true,
    verificationStatus: 'verified',
    subscriptionPlan: 'Basic',
    subscriptionStatus: 'paused',
    createdAt: '2023-10-20T14:30:00Z',
    updatedAt: '2024-01-08T16:45:00Z',
    approvedAt: '2023-10-25T10:15:00Z',
    location: {
      street: '789 Creative Quarter',
      city: 'Pune',
      state: 'Maharashtra',
      zipCode: '411001',
      country: 'IN'
    },
    contactPerson: {
      name: 'Amit Patel',
      email: 'amit@brewandwork.com',
      phone: '+91-76543-21098',
      designation: 'Owner'
    },
    businessType: 'Cafe & Workspace',
    totalSpaces: 15,
    totalBookings: 120,
    totalRevenue: 35000.00,
    rating: 4.5,
    reviewCount: 42
  }
];

// Helper function to get partner by ID
export const getPartnerById = (id: string): PartnerData | undefined => {
  return mockPartners.find(partner => partner.id === id);
};

// Helper function to get verification status color for partners
export const getPartnerVerificationStatusColor = (status: string): string => {
  switch (status) {
    case 'verified':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'secondary';
  }
};

// Helper function to format partner name
export const formatPartnerName = (partner: PartnerData): string => {
  return partner.name;
};