// User mock data for admin dashboard

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  isVerified: boolean;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  totalBookings: number;
  totalSpent: number;
  preferences: {
    notifications: boolean;
    marketing: boolean;
    language: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  documents: {
    id: string;
    type: string;
    status: 'approved' | 'pending' | 'rejected';
    uploadedAt: string;
    reviewedAt?: string;
  }[];
  flags: {
    id: string;
    type: string;
    reason: string;
    createdAt: string;
    status: 'active' | 'resolved';
  }[];
  tags: string[];
}

// Mock user data for Dan John (from UserMetaCardAdmin)
export const mockUserData: UserData = {
  id: 'user-dan-001',
  firstName: 'Dan',
  lastName: 'John',
  email: 'dan.john@example.com',
  phone: '+1-555-0123',
  avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20businessman&image_size=square',
  status: 'active',
  isVerified: true,
  verificationStatus: 'verified',
  emailVerified: true,
  phoneVerified: true,
  createdAt: '2024-01-10T09:30:00Z',
  updatedAt: '2024-01-15T10:15:00Z',
  lastLoginAt: '2024-01-15T08:45:00Z',
  totalBookings: 12,
  totalSpent: 2450.00,
  preferences: {
    notifications: true,
    marketing: false,
    language: 'en'
  },
  address: {
    street: '123 Business Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  },
  documents: [
    {
      id: 'doc-1',
      type: 'id_card',
      status: 'approved',
      uploadedAt: '2024-01-10T10:00:00Z',
      reviewedAt: '2024-01-10T14:30:00Z'
    }
  ],
  flags: [],
  tags: ['premium', 'frequent-user']
};

// Additional mock users for testing
export const mockUsers: UserData[] = [
  mockUserData,
  {
    id: 'user-emily-002',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    phone: '+1-555-0456',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20businesswoman&image_size=square',
    status: 'active',
    isVerified: false,
    verificationStatus: 'pending',
    emailVerified: true,
    phoneVerified: false,
    createdAt: '2024-01-12T14:20:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
    lastLoginAt: '2024-01-14T16:45:00Z',
    totalBookings: 5,
    totalSpent: 890.00,
    preferences: {
      notifications: true,
      marketing: true,
      language: 'en'
    },
    address: {
      street: '456 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'US'
    },
    documents: [
      {
        id: 'doc-2',
        type: 'id_card',
        status: 'pending',
        uploadedAt: '2024-01-14T15:00:00Z'
      }
    ],
    flags: [],
    tags: ['new-user']
  },
  {
    id: 'user-mike-003',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    phone: '+1-555-0789',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20headshot%20of%20a%20young%20professional&image_size=square',
    status: 'suspended',
    isVerified: true,
    verificationStatus: 'verified',
    emailVerified: true,
    phoneVerified: true,
    createdAt: '2023-12-15T11:00:00Z',
    updatedAt: '2024-01-13T09:20:00Z',
    lastLoginAt: '2024-01-12T20:30:00Z',
    totalBookings: 8,
    totalSpent: 1200.00,
    preferences: {
      notifications: false,
      marketing: false,
      language: 'en'
    },
    address: {
      street: '789 Main Street',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'US'
    },
    documents: [
      {
        id: 'doc-3',
        type: 'id_card',
        status: 'approved',
        uploadedAt: '2023-12-15T12:00:00Z',
        reviewedAt: '2023-12-15T16:30:00Z'
      }
    ],
    flags: [
      {
        id: 'flag-1',
        type: 'payment_dispute',
        reason: 'Disputed charge for booking #BK-2024-001',
        createdAt: '2024-01-13T09:20:00Z',
        status: 'active'
      }
    ],
    tags: ['disputed', 'suspended']
  }
];

// Helper function to get user by ID
export const getUserById = (id: string): UserData | undefined => {
  return mockUsers.find(user => user.id === id);
};

// Helper function to format user full name
export const formatUserName = (user: UserData): string => {
  return `${user.firstName} ${user.lastName}`;
};

// Helper function to get verification status color
export const getVerificationStatusColor = (status: string): string => {
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

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};