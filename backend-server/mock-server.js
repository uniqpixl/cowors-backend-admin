import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
const PORT = 5001;

// Cowors ID Generation
const EntityType = {
  USER: 'CUS',
  PARTNER: 'CPT',
  SPACE: 'CSP',
  BOOKING: 'BK',
  ADMIN: 'CAD',
  CATEGORY: 'CCT',
  SUBCATEGORY: 'CSC',
  NOTIFICATION: 'CNT',
  PAYMENT: 'CPY',
  REFUND: 'CRF',
  ORDER: 'COR',
  PAYMENT_INTENT: 'CPI',
  TRANSACTION: 'CTX',
  PAYOUT_TRANSACTION: 'CXT',
  PAYOUT_OPERATION: 'CPO',
  AUDIT: 'CAU',
  MESSAGE: 'CMG',
  RULE_VERSION: 'CRV',
  REQUEST: 'CRQ',
  INVOICE: 'CIN',
  TAX_TRANSACTION: 'CTT',
  TAX_COMPLIANCE: 'CTC',
  PAYOUT_REQUEST: 'CPR',
  PAYOUT: 'CPA',
  WALLET_TRANSACTION: 'CWT',
  WALLET: 'CWL',
  REVIEW: 'CRW',
  CITY: 'CTY',
  NEIGHBORHOOD: 'NBH'
};

function generateCoworsId(entityType) {
  const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const SUFFIX_LENGTH = 6;
  
  // Generate 6-character alphanumeric suffix with guaranteed mix of letters and numbers
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let result = '';
  const randomBuffer = crypto.randomBytes(SUFFIX_LENGTH);
  
  // Ensure at least one letter and one number
  const positions = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
  const letterPosition = positions[0];
  const numberPosition = positions[1];
  
  for (let i = 0; i < SUFFIX_LENGTH; i++) {
    let char;
    
    if (i === letterPosition) {
      // Force a letter at this position
      const letterIndex = randomBuffer[i] % letters.length;
      char = letters[letterIndex];
    } else if (i === numberPosition) {
      // Force a number at this position
      const numberIndex = randomBuffer[i] % numbers.length;
      char = numbers[numberIndex];
    } else {
      // Random alphanumeric character
      const charIndex = randomBuffer[i] % ALPHANUMERIC_CHARS.length;
      char = ALPHANUMERIC_CHARS[charIndex];
    }
    
    result += char;
  }
  
  return `${entityType}-${result}`;
}

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());

// Mock JWT secret
const JWT_SECRET = 'mock-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Mock data
const mockUsers = [
  {
    id: generateCoworsId(EntityType.USER),
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin'
  }
];

// ===== LOCATIONS: CITIES & NEIGHBORHOODS (Public + Admin) =====
// Mock cities with diverse states and launch statuses
const mockCities = [
  { id: generateCoworsId(EntityType.CITY), name: 'Mumbai', state: 'Maharashtra', gst_state_code: '27', launch_status: 'ACTIVE', tier_classification: 'Tier-1', expansion_priority: 'High', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateCoworsId(EntityType.CITY), name: 'Pune', state: 'Maharashtra', gst_state_code: '27', launch_status: 'PAUSED', tier_classification: 'Tier-2', expansion_priority: 'Medium', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateCoworsId(EntityType.CITY), name: 'Bengaluru', state: 'Karnataka', gst_state_code: '29', launch_status: 'LAUNCHING', tier_classification: 'Tier-1', expansion_priority: 'High', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateCoworsId(EntityType.CITY), name: 'Mysuru', state: 'Karnataka', gst_state_code: '29', launch_status: 'PLANNING', tier_classification: 'Tier-2', expansion_priority: 'Low', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateCoworsId(EntityType.CITY), name: 'Delhi', state: 'Delhi', gst_state_code: '07', launch_status: 'ACTIVE', tier_classification: 'Tier-1', expansion_priority: 'High', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateCoworsId(EntityType.CITY), name: 'Gurugram', state: 'Haryana', gst_state_code: '06', launch_status: 'PAUSED', tier_classification: 'Tier-1', expansion_priority: 'Medium', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateCoworsId(EntityType.CITY), name: 'Noida', state: 'Uttar Pradesh', gst_state_code: '09', launch_status: 'LAUNCHING', tier_classification: 'Tier-1', expansion_priority: 'High', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateCoworsId(EntityType.CITY), name: 'Lucknow', state: 'Uttar Pradesh', gst_state_code: '09', launch_status: 'PLANNING', tier_classification: 'Tier-2', expansion_priority: 'Low', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

// Create a simple neighborhoods list mapped to cities
const mockNeighborhoods = [];
for (const city of mockCities) {
  const base = city.name.toLowerCase();
  mockNeighborhoods.push(
    { id: generateCoworsId(EntityType.NEIGHBORHOOD), city_id: city.id, name: `${city.name} Central`, display_name: `${city.name} Central`, popular_tags: ['central', 'business'], is_popular: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: generateCoworsId(EntityType.NEIGHBORHOOD), city_id: city.id, name: `${city.name} South`, display_name: `${city.name} South`, popular_tags: ['residential', 'quiet'], is_popular: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: generateCoworsId(EntityType.NEIGHBORHOOD), city_id: city.id, name: `${city.name} Tech Park`, display_name: `${city.name} Tech Park`, popular_tags: ['tech', 'startup'], is_popular: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  );
}



// Public endpoints (no auth)
app.get('/api/v1/cities', (req, res) => {
  res.json(mockCities);
});

app.get('/api/v1/cities/:cityId/neighborhoods', (req, res) => {
  const { cityId } = req.params;
  const list = mockNeighborhoods.filter(n => n.city_id === cityId);
  res.json(list);
});

// Admin endpoints for state summary and launch status updates
app.get('/api/v1/admin/cities/states/summary', authenticateToken, (req, res) => {
  const byState = new Map();
  for (const city of mockCities) {
    const state = city.state || 'Unknown';
    const entry = byState.get(state) || { state, total: 0, active: 0, paused: 0, planning: 0, launching: 0 };
    entry.total += 1;
    switch (city.launch_status) {
      case 'ACTIVE': entry.active += 1; break;
      case 'PAUSED': entry.paused += 1; break;
      case 'PLANNING': entry.planning += 1; break;
      case 'LAUNCHING': entry.launching += 1; break;
    }
    byState.set(state, entry);
  }
  res.json(Array.from(byState.values()));
});

app.patch('/api/v1/admin/cities/:id/launch-status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const city = mockCities.find(c => c.id === id);
  if (!city) return res.status(404).json({ message: 'City not found' });
  city.launch_status = status;
  city.updated_at = new Date().toISOString();
  res.json({ id: city.id, launch_status: city.launch_status });
});

app.patch('/api/v1/admin/cities/state/:state/launch-status', authenticateToken, (req, res) => {
  const { state } = req.params;
  const { status } = req.body || {};
  let updated = 0;
  for (const city of mockCities) {
    if ((city.state || '').toLowerCase() === decodeURIComponent(state).toLowerCase()) {
      city.launch_status = status;
      city.updated_at = new Date().toISOString();
      updated += 1;
    }
  }
  res.json({ state: decodeURIComponent(state), updated, launch_status: status });
});

// Mock partners data with realistic business names and diverse types
// NOTE: For the MVP we focus exclusively on SPACE partners.
// partnerType values below should reflect space-related categories only.
const mockPartners = [
  {
    id: generateCoworsId(EntityType.PARTNER),
    name: 'WeWork Downtown',
    businessName: 'WeWork Downtown',
    email: 'contact@wework-downtown.com',
    phone: '+1-555-0101',
    status: 'active',
    partnerType: 'coworking',
    category: 'Coworking Space',
    location: 'New York, NY',
    address: '123 Broadway, New York, NY 10001',
    rating: 4.8,
    totalSpaces: 25,
    totalBookings: 1250,
    monthlyRevenue: 45000,
    commissionRate: 15,
    verificationStatus: 'verified',
    joinedDate: '2023-01-15',
    createdAt: new Date('2023-01-15').toISOString()
  },
  {
    id: generateCoworsId(EntityType.PARTNER),
    name: 'Blue Bottle Coffee',
    businessName: 'Blue Bottle Coffee Co.',
    email: 'partnerships@bluebottlecoffee.com',
    phone: '+1-555-0102',
    status: 'active',
    partnerType: 'cafe',
    category: 'Coffee Shop',
    location: 'San Francisco, CA',
    address: '456 Mission St, San Francisco, CA 94105',
    rating: 4.6,
    totalSpaces: 8,
    totalBookings: 680,
    monthlyRevenue: 12000,
    commissionRate: 12,
    verificationStatus: 'verified',
    joinedDate: '2023-03-22',
    createdAt: new Date('2023-03-22').toISOString()
  },
  {
    id: generateCoworsId(EntityType.PARTNER),
    name: 'TechHub Austin',
    businessName: 'TechHub Austin Innovation Center',
    email: 'hello@techhub-austin.com',
    phone: '+1-555-0104',
    status: 'active',
    partnerType: 'coworking',
    category: 'Tech Coworking',
    location: 'Austin, TX',
    address: '321 Congress Ave, Austin, TX 78701',
    rating: 4.7,
    totalSpaces: 18,
    totalBookings: 950,
    monthlyRevenue: 28000,
    commissionRate: 16,
    verificationStatus: 'verified',
    joinedDate: '2023-02-14',
    createdAt: new Date('2023-02-14').toISOString()
  },
  {
    id: generateCoworsId(EntityType.PARTNER),
    name: 'Creative Loft Studios',
    businessName: 'Creative Loft Studios LLC',
    email: 'bookings@creativeloft.com',
    phone: '+1-555-0105',
    status: 'pending',
    partnerType: 'event_space',
    category: 'Event & Creative Space',
    location: 'Los Angeles, CA',
    address: '654 Arts District, Los Angeles, CA 90013',
    rating: 4.4,
    totalSpaces: 12,
    totalBookings: 420,
    monthlyRevenue: 18000,
    commissionRate: 20,
    verificationStatus: 'pending',
    joinedDate: '2024-01-10',
    createdAt: new Date('2024-01-10').toISOString()
  },
  {
    id: generateCoworsId(EntityType.PARTNER),
    name: 'Starbucks Reserve',
    businessName: 'Starbucks Reserve Roastery',
    email: 'reserve@starbucks.com',
    phone: '+1-555-0106',
    status: 'active',
    partnerType: 'cafe',
    category: 'Premium Coffee',
    location: 'Seattle, WA',
    address: '1124 Pike St, Seattle, WA 98101',
    rating: 4.5,
    totalSpaces: 6,
    totalBookings: 320,
    monthlyRevenue: 8500,
    commissionRate: 10,
    verificationStatus: 'verified',
    joinedDate: '2023-06-30',
    createdAt: new Date('2023-06-30').toISOString()
  },
  {
    id: generateCoworsId(EntityType.PARTNER),
    name: 'Rooftop Gardens Event Space',
    businessName: 'Rooftop Gardens LLC',
    email: 'events@rooftopgardens.com',
    phone: '+1-555-0109',
    status: 'active',
    partnerType: 'event_space',
    category: 'Outdoor Event Space',
    location: 'Denver, CO',
    address: '555 Skyline Dr, Denver, CO 80202',
    rating: 4.9,
    totalSpaces: 5,
    totalBookings: 240,
    monthlyRevenue: 22000,
    commissionRate: 25,
    verificationStatus: 'verified',
    joinedDate: '2023-04-12',
    createdAt: new Date('2023-04-12').toISOString()
  },
  {
    id: generateCoworsId(EntityType.PARTNER),
    name: 'Innovation Hub Portland',
    businessName: 'Innovation Hub Portland Inc.',
    email: 'connect@innovationhub-pdx.com',
    phone: '+1-555-0110',
    status: 'pending',
    partnerType: 'coworking',
    category: 'Startup Incubator',
    location: 'Portland, OR',
    address: '111 Innovation Way, Portland, OR 97201',
    rating: 4.3,
    totalSpaces: 20,
    totalBookings: 650,
    monthlyRevenue: 19500,
    commissionRate: 17,
    verificationStatus: 'under_review',
    joinedDate: '2024-01-25',
    createdAt: new Date('2024-01-25').toISOString()
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock server is running' });
});

// Login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Find user
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Return success response
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    },
    token
  });
});

// Partners endpoint (SPACE-only for MVP)
app.get('/api/v1/admin/partners', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Only include true "SPACE" subtypes for MVP
  // Aligned with SpaceSubtype in partner.enum.ts: CAFE, COWORKING_SPACE, OFFICE_SPACE, RESTOBAR, EVENT_SPACE
  const ALLOWED_SPACE_TYPES = new Set([
    'cafe',
    'coworking',
    'coworking_space',
    'office_space',
    'restobar',
    'event_space',
  ]);

  const spacePartners = mockPartners.filter((p) => ALLOWED_SPACE_TYPES.has(String(p?.partnerType).toLowerCase()));
  const paginatedPartners = spacePartners.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedPartners,
    pagination: {
      page,
      limit,
      total: spacePartners.length,
      totalPages: Math.ceil(spacePartners.length / limit),
    },
  });
});

// Dashboard KPIs endpoint
app.get('/api/v1/admin/dashboard/kpis', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalPartners: 10,
      totalSpaces: 25,
      totalBookings: 89,
      revenue: 15000
    }
  });
});

// Analytics endpoints
app.get('/api/v1/admin/analytics/platform-stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalPartners: 10,
      totalSpaces: 25,
      totalBookings: 89
    }
  });
});

app.get('/api/v1/admin/analytics/bookings', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalBookings: 89,
      thisMonth: 25,
      lastMonth: 20,
      growth: 25
    }
  });
});

app.get('/api/v1/admin/analytics/users', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      activeUsers: 120,
      newUsers: 15,
      growth: 12
    }
  });
});

app.get('/api/v1/admin/analytics/revenue', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 15000,
      thisMonth: 4500,
      lastMonth: 3800,
      growth: 18
    }
  });
});

app.get('/api/v1/admin/activity/feed', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        type: 'booking',
        message: 'New booking created',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'user',
        message: 'New user registered',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// ===== DASHBOARD & ANALYTICS ENDPOINTS =====
app.get('/api/v1/admin/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalPartners: 10,
      totalSpaces: 25,
      totalBookings: 89,
      revenue: 15000,
      growth: 12.5
    }
  });
});

app.get('/api/v1/admin/dashboard/notifications', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', type: 'info', message: 'System maintenance scheduled', timestamp: new Date().toISOString() },
      { id: '2', type: 'warning', message: 'High booking volume detected', timestamp: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/analytics/booking-trends', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      trends: [
        { date: '2024-01-01', bookings: 25 },
        { date: '2024-01-02', bookings: 30 },
        { date: '2024-01-03', bookings: 28 }
      ]
    }
  });
});

app.get('/api/v1/admin/analytics/revenue-trends', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      trends: [
        { date: '2024-01-01', revenue: 1500 },
        { date: '2024-01-02', revenue: 1800 },
        { date: '2024-01-03', revenue: 1650 }
      ]
    }
  });
});

app.get('/api/v1/admin/analytics/user-growth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      growth: [
        { date: '2024-01-01', users: 145 },
        { date: '2024-01-02', users: 148 },
        { date: '2024-01-03', users: 150 }
      ]
    }
  });
});

app.get('/api/v1/admin/financial/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 15000,
      totalTransactions: 245,
      pendingPayouts: 2500,
      totalCommissions: 1200
    }
  });
});

// ===== USER MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/users', authenticateToken, (req, res) => {
  const mockUsers = Array.from({ length: 20 }, (_, i) => ({
    id: generateCoworsId(EntityType.USER),
    firstName: `User${i + 1}`,
    lastName: `Last${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: i % 3 === 0 ? 'pending' : 'active',
    createdAt: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    data: mockUsers,
    pagination: { page: 1, limit: 20, total: 150, totalPages: 8 }
  });
});

app.get('/api/v1/admin/users/search', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active' }
    ]
  });
});

app.get('/api/v1/admin/users/statistics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      activeUsers: 120,
      pendingUsers: 15,
      suspendedUsers: 15
    }
  });
});

app.get('/api/v1/admin/users/verification/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalVerifications: 100,
      pendingVerifications: 25,
      approvedVerifications: 65,
      rejectedVerifications: 10
    }
  });
});

app.get('/api/v1/admin/users/verification/pending', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'ver-1', userId: 'user-1', type: 'identity', status: 'pending', submittedAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/users/verification/all', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'ver-1', userId: 'user-1', type: 'identity', status: 'approved', submittedAt: new Date().toISOString() },
      { id: 'ver-2', userId: 'user-2', type: 'address', status: 'pending', submittedAt: new Date().toISOString() }
    ]
  });
});

app.post('/api/v1/admin/users/verification/review', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Verification reviewed successfully'
  });
});

app.get('/api/v1/admin/users/kyc/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalKyc: 80,
      pendingKyc: 20,
      approvedKyc: 50,
      rejectedKyc: 10
    }
  });
});

app.get('/api/v1/admin/users/kyc/pending', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'kyc-1', userId: 'user-1', status: 'pending', submittedAt: new Date().toISOString() }
    ]
  });
});

app.post('/api/v1/admin/users/kyc/review', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'KYC reviewed successfully'
  });
});

app.post('/api/v1/admin/users/kyc/bulk-review', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bulk KYC review completed'
  });
});

app.get('/api/v1/admin/users/flags', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'flag-1', userId: 'user-1', type: 'suspicious', reason: 'Multiple failed payments', createdAt: new Date().toISOString() }
    ]
  });
});

app.post('/api/v1/admin/users/flags/add', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Flag added successfully'
  });
});

app.put('/api/v1/admin/users/flags/update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Flag updated successfully'
  });
});

app.delete('/api/v1/admin/users/flags/remove', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Flag removed successfully'
  });
});

// User-specific endpoints
app.get('/api/v1/admin/users/:id/bookings', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'booking-1', spaceId: 'space-1', status: 'confirmed', createdAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/users/:id/documents', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'doc-1', type: 'identity', status: 'verified', uploadedAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/users/:id/payments', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'payment-1', amount: 150, status: 'completed', createdAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/users/:id/transactions', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'txn-1', type: 'payment', amount: 150, status: 'completed', createdAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/users/:id/verification', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'ver-1',
      userId: req.params.id,
      identityVerified: true,
      addressVerified: false,
      phoneVerified: true
    }
  });
});

app.get('/api/v1/admin/users/:id/wallet', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'wallet-1',
      userId: req.params.id,
      balance: 250.50,
      currency: 'USD'
    }
  });
});

app.get('/api/v1/admin/users/:id/activity', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'activity-1', type: 'login', timestamp: new Date().toISOString() },
      { id: 'activity-2', type: 'booking', timestamp: new Date().toISOString() }
    ]
  });
});

// ===== BOOKING MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/bookings', authenticateToken, (req, res) => {
  const mockBookings = Array.from({ length: 15 }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + i);
    startDate.setHours(9 + (i % 8), 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 2 + (i % 4));
    
    return {
      id: generateCoworsId(EntityType.BOOKING),
      userId: generateCoworsId(EntityType.USER),
      spaceId: generateCoworsId(EntityType.SPACE),
      partnerId: generateCoworsId(EntityType.PARTNER),
      status: ['confirmed', 'pending', 'cancelled', 'completed'][i % 4],
      paymentStatus: ['paid', 'pending', 'failed'][i % 3],
      paymentMethod: ['card', 'upi', 'wallet', 'bank_transfer'][i % 4],
      bookingType: ['individual', 'team', 'event', 'meeting'][i % 4],
      totalAmount: 150 + (i * 25),
      amount: 150 + (i * 25),
      guests: 1 + (i % 5),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString(),
      amenities: i % 3 === 0 ? ['WiFi', 'Coffee'] : [],
      partnerName: `Partner ${i + 1}`,
      user: {
        id: generateCoworsId(EntityType.USER),
        firstName: `User${i + 1}`,
        lastName: `LastName${i + 1}`,
        email: `user${i + 1}@example.com`
      },
      space: {
        id: generateCoworsId(EntityType.SPACE),
        name: `Space ${i + 1}`,
        spaceType: ['Workspace', 'Meeting Room', 'Event Space', 'Cafe'][i % 4],
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Pune'][i % 4],
        state: ['Maharashtra', 'Delhi', 'Karnataka', 'Maharashtra'][i % 4]
      }
    };
  });
  
  res.json({
    success: true,
    data: mockBookings,
    pagination: { page: 1, limit: 15, total: 89, totalPages: 6 }
  });
});

app.get('/api/v1/admin/bookings/search', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'booking-1', userId: 'user-1', spaceId: 'space-1', status: 'confirmed', amount: 150 }
    ]
  });
});

app.get('/api/v1/admin/bookings/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalBookings: 89,
      confirmedBookings: 65,
      pendingBookings: 15,
      cancelledBookings: 9
    }
  });
});

app.get('/api/v1/admin/bookings/pending', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'booking-1', userId: 'user-1', spaceId: 'space-1', status: 'pending', amount: 150 }
    ]
  });
});

app.get('/api/v1/admin/bookings/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 13350,
      averageBookingValue: 150,
      bookingTrends: [
        { date: '2024-01-01', count: 25 },
        { date: '2024-01-02', count: 30 }
      ]
    }
  });
});

app.put('/api/v1/admin/bookings/status/update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Booking status updated successfully'
  });
});

app.get('/api/v1/admin/bookings/extend', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Booking extended successfully'
  });
});

app.get('/api/v1/admin/bookings/cancel', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

app.get('/api/v1/admin/bookings/refund', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Booking refunded successfully'
  });
});

app.get('/api/v1/admin/bookings/disputes', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'dispute-1', bookingId: 'booking-1', reason: 'Space not as described', status: 'open' }
    ]
  });
});

app.get('/api/v1/admin/bookings/bulk-update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bulk update completed successfully'
  });
});

app.get('/api/v1/admin/bookings/export', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Export initiated successfully',
    downloadUrl: '/api/v1/admin/downloads/bookings.csv'
  });
});

// ===== SPACE MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/spaces', authenticateToken, (req, res) => {
  const mockSpaces = Array.from({ length: 12 }, (_, i) => ({
    id: generateCoworsId(EntityType.SPACE),
    name: `Space ${i + 1}`,
    partnerId: generateCoworsId(EntityType.PARTNER),
    status: ['active', 'pending', 'inactive'][i % 3],
    pricePerHour: 25 + (i * 5),
    createdAt: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    data: mockSpaces,
    pagination: { page: 1, limit: 12, total: 25, totalPages: 3 }
  });
});

app.get('/api/v1/admin/spaces/search', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'space-1', name: 'Conference Room A', partnerId: 'partner-1', status: 'active' }
    ]
  });
});

app.get('/api/v1/admin/spaces/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalSpaces: 25,
      activeSpaces: 20,
      pendingSpaces: 3,
      inactiveSpaces: 2
    }
  });
});

app.get('/api/v1/admin/spaces/pending', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'space-1', name: 'New Conference Room', partnerId: 'partner-1', status: 'pending' }
    ]
  });
});

app.get('/api/v1/admin/spaces/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 12500,
      averageUtilization: 75,
      topPerformingSpaces: [
        { id: 'space-1', name: 'Conference Room A', revenue: 2500 }
      ]
    }
  });
});

app.get('/api/v1/admin/spaces/approval', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Space approved successfully'
  });
});

app.get('/api/v1/admin/spaces/rejection', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Space rejected successfully'
  });
});

app.put('/api/v1/admin/spaces/status/update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Space status updated successfully'
  });
});

app.get('/api/v1/admin/spaces/bulk-update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bulk space update completed'
  });
});

app.get('/api/v1/admin/spaces/export', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Space export initiated',
    downloadUrl: '/api/v1/admin/downloads/spaces.csv'
  });
});

// Space-specific endpoints
app.get('/api/v1/admin/spaces/:id/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      spaceId: req.params.id,
      totalBookings: 45,
      totalRevenue: 2250,
      utilizationRate: 78
    }
  });
});

app.get('/api/v1/admin/spaces/:id/bookings', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'booking-1', userId: 'user-1', status: 'confirmed', amount: 150 }
    ]
  });
});

app.get('/api/v1/admin/spaces/:id/revenue', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      spaceId: req.params.id,
      totalRevenue: 2250,
      monthlyRevenue: [
        { month: '2024-01', revenue: 750 },
        { month: '2024-02', revenue: 800 }
      ]
    }
  });
});

// ===== PARTNER MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/partners/search', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'partner-1', name: 'Partner One', email: 'partner1@example.com', status: 'active' }
    ]
  });
});

app.get('/api/v1/admin/partners/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalPartners: 10,
      activePartners: 8,
      pendingPartners: 1,
      inactivePartners: 1
    }
  });
});

app.get('/api/v1/admin/partners/pending', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'partner-1', name: 'New Partner', email: 'newpartner@example.com', status: 'pending' }
    ]
  });
});

app.get('/api/v1/admin/partners/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 15000,
      averageRevenuePerPartner: 1500,
      topPartners: [
        { id: 'partner-1', name: 'Partner One', revenue: 3000 }
      ]
    }
  });
});

app.get('/api/v1/admin/partners/verification', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'partner-1', name: 'Partner One', verificationStatus: 'verified' }
    ]
  });
});

app.get('/api/v1/admin/partners/approval', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Partner approved successfully'
  });
});

app.get('/api/v1/admin/partners/rejection', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Partner rejected successfully'
  });
});

app.put('/api/v1/admin/partners/status/update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Partner status updated successfully'
  });
});

app.get('/api/v1/admin/partners/bulk-update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bulk partner update completed'
  });
});

// Partner-specific endpoints
app.get('/api/v1/admin/partners/:id/bookings', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'booking-1', spaceId: 'space-1', userId: 'user-1', status: 'confirmed' }
    ]
  });
});

app.get('/api/v1/admin/partners/:id/revenue', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      partnerId: req.params.id,
      totalRevenue: 3000,
      monthlyRevenue: [
        { month: '2024-01', revenue: 1000 },
        { month: '2024-02', revenue: 1200 }
      ]
    }
  });
});

app.get('/api/v1/admin/partners/:id/spaces', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'space-1', name: 'Conference Room A', status: 'active' },
      { id: 'space-2', name: 'Meeting Room B', status: 'active' }
    ]
  });
});

app.get('/api/v1/admin/partners/:id/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      partnerId: req.params.id,
      totalSpaces: 3,
      totalBookings: 45,
      totalRevenue: 3000,
      averageRating: 4.5
    }
  });
});

// Partner categories and types
app.get('/api/v1/admin/partner-categories', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'cat-1', name: 'Coworking Spaces', description: 'Shared office spaces' },
      { id: 'cat-2', name: 'Meeting Rooms', description: 'Private meeting spaces' }
    ]
  });
});

app.get('/api/v1/admin/partner-subcategories', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'subcat-1', categoryId: 'cat-1', name: 'Hot Desks', description: 'Flexible desk spaces' },
      { id: 'subcat-2', categoryId: 'cat-1', name: 'Private Offices', description: 'Dedicated office spaces' }
    ]
  });
});

app.get('/api/v1/admin/partner-types', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'type-1', name: 'Individual', description: 'Individual space owners' },
      { id: 'type-2', name: 'Business', description: 'Business entities' }
    ]
  });
});

// ===== FINANCIAL MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/transactions', authenticateToken, (req, res) => {
  const mockTransactions = Array.from({ length: 15 }, (_, i) => ({
    id: generateCoworsId(EntityType.TRANSACTION),
    userId: generateCoworsId(EntityType.USER),
    type: ['payment', 'refund', 'payout'][i % 3],
    amount: 150 + (i * 25),
    status: ['completed', 'pending', 'failed'][i % 3],
    createdAt: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    data: mockTransactions,
    pagination: { page: 1, limit: 15, total: 245, totalPages: 17 }
  });
});

app.post('/api/v1/admin/transactions/search', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'txn-1', userId: 'user-1', type: 'payment', amount: 150, status: 'completed' }
    ]
  });
});

app.get('/api/v1/admin/transactions/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalTransactions: 245,
      completedTransactions: 200,
      pendingTransactions: 30,
      failedTransactions: 15,
      totalVolume: 36750
    }
  });
});

app.get('/api/v1/admin/transactions/pending', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'txn-1', userId: 'user-1', type: 'payment', amount: 150, status: 'pending' }
    ]
  });
});

app.get('/api/v1/admin/transactions/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalVolume: 36750,
      averageTransactionValue: 150,
      transactionTrends: [
        { date: '2024-01-01', volume: 1500 },
        { date: '2024-01-02', volume: 1800 }
      ]
    }
  });
});

app.post('/api/v1/admin/transactions/refunds', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Refund processed successfully'
  });
});

app.get('/api/v1/admin/transactions/disputes', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'dispute-1', transactionId: 'txn-1', reason: 'Unauthorized charge', status: 'open' }
    ]
  });
});

app.post('/api/v1/admin/transactions/export', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Transaction export initiated',
    downloadUrl: '/api/v1/admin/downloads/transactions.csv'
  });
});

app.get('/api/v1/admin/invoices/partner', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'inv-1', partnerId: 'partner-1', amount: 500, status: 'paid', dueDate: '2024-02-01' }
    ]
  });
});

app.get('/api/v1/admin/invoices/user', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'inv-1', userId: 'user-1', amount: 150, status: 'paid', dueDate: '2024-02-01' }
    ]
  });
});

// ===== WALLET MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/partner-wallets', authenticateToken, (req, res) => {
  const mockWallets = Array.from({ length: 10 }, (_, i) => ({
    id: generateCoworsId(EntityType.WALLET),
    partnerId: generateCoworsId(EntityType.PARTNER),
    balance: 250.50 + (i * 100),
    currency: 'USD',
    status: 'active'
  }));
  
  res.json({
    success: true,
    data: mockWallets
  });
});

app.get('/api/v1/admin/partner-wallets/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalWallets: 10,
      totalBalance: 5250.50,
      activeWallets: 8,
      frozenWallets: 2
    }
  });
});

app.get('/api/v1/admin/partner-wallets/pending', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'wallet-1', partnerId: 'partner-1', pendingAmount: 150, reason: 'Payout processing' }
    ]
  });
});

app.get('/api/v1/admin/partner-wallets/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalBalance: 5250.50,
      averageBalance: 525.05,
      balanceTrends: [
        { date: '2024-01-01', totalBalance: 5000 },
        { date: '2024-01-02', totalBalance: 5250.50 }
      ]
    }
  });
});

app.get('/api/v1/admin/partner-wallets/payouts', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'payout-1', partnerId: 'partner-1', amount: 500, status: 'completed', processedAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/partner-wallets/adjustments', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'adj-1', partnerId: 'partner-1', amount: -50, reason: 'Chargeback', createdAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/v1/admin/partner-wallets/freeze', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Wallet frozen successfully'
  });
});

app.get('/api/v1/admin/partner-wallets/bulk-action', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bulk wallet action completed'
  });
});

app.get('/api/v1/admin/finance/user-wallets', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'wallet-1', userId: 'user-1', balance: 150.25, currency: 'USD', status: 'active' }
    ]
  });
});

app.get('/api/v1/admin/payouts', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Mock payout data
  const mockPayouts = [
    { 
      id: generateCoworsId(EntityType.PAYOUT), 
      partnerId: generateCoworsId(EntityType.PARTNER), 
      partnerName: 'WeWork Downtown',
      amount: 1500.00, 
      status: 'completed', 
      method: 'bank_transfer',
      processedAt: new Date('2024-01-15').toISOString(),
      createdAt: new Date('2024-01-10').toISOString()
    },
    { 
      id: generateCoworsId(EntityType.PAYOUT), 
      partnerId: generateCoworsId(EntityType.PARTNER), 
      partnerName: 'Blue Bottle Coffee',
      amount: 750.50, 
      status: 'pending', 
      method: 'bank_transfer',
      processedAt: null,
      createdAt: new Date('2024-01-12').toISOString()
    },
    { 
      id: generateCoworsId(EntityType.PAYOUT), 
      partnerId: generateCoworsId(EntityType.PARTNER), 
      partnerName: 'TechHub Austin',
      amount: 2200.75, 
      status: 'processing', 
      method: 'bank_transfer',
      processedAt: null,
      createdAt: new Date('2024-01-14').toISOString()
    },
    { 
      id: generateCoworsId(EntityType.PAYOUT), 
      partnerId: generateCoworsId(EntityType.PARTNER), 
      partnerName: 'Creative Loft Studios',
      amount: 980.25, 
      status: 'failed', 
      method: 'bank_transfer',
      processedAt: null,
      createdAt: new Date('2024-01-13').toISOString()
    }
  ];

  const total = mockPayouts.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const payouts = mockPayouts.slice(startIndex, endIndex);

  res.json({
    success: true,
    payouts: payouts,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages
    }
  });
});

// ===== REVIEWS MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/reviews', authenticateToken, (req, res) => {
  const mockReviews = Array.from({ length: 15 }, (_, i) => ({
    id: generateCoworsId(EntityType.REVIEW),
    userId: generateCoworsId(EntityType.USER),
    spaceId: generateCoworsId(EntityType.SPACE),
    rating: 3 + (i % 3),
    comment: `This is review ${i + 1}`,
    status: ['approved', 'pending', 'flagged'][i % 3],
    createdAt: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    data: mockReviews
  });
});

app.get('/api/v1/admin/reviews/search', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'review-1', userId: 'user-1', spaceId: 'space-1', rating: 5, comment: 'Great space!', status: 'approved' }
    ]
  });
});

app.get('/api/v1/admin/reviews/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalReviews: 150,
      approvedReviews: 120,
      pendingReviews: 20,
      flaggedReviews: 10,
      averageRating: 4.2
    }
  });
});

app.get('/api/v1/admin/reviews/flagged', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'review-1', userId: 'user-1', spaceId: 'space-1', rating: 1, comment: 'Inappropriate content', status: 'flagged' }
    ]
  });
});

app.get('/api/v1/admin/reviews/moderate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Review moderated successfully'
  });
});

app.get('/api/v1/admin/reviews/analytics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      averageRating: 4.2,
      ratingDistribution: {
        '5': 60,
        '4': 45,
        '3': 25,
        '2': 15,
        '1': 5
      },
      reviewTrends: [
        { date: '2024-01-01', count: 10, averageRating: 4.1 },
        { date: '2024-01-02', count: 12, averageRating: 4.3 }
      ]
    }
  });
});

app.get('/api/v1/admin/reviews/bulk-update', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Bulk review update completed'
  });
});

app.get('/api/v1/admin/reviews/sentiment', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      positive: 85,
      neutral: 10,
      negative: 5,
      sentimentTrends: [
        { date: '2024-01-01', positive: 80, neutral: 15, negative: 5 },
        { date: '2024-01-02', positive: 85, neutral: 10, negative: 5 }
      ]
    }
  });
});

// ===== CONFIGURATION MANAGEMENT ENDPOINTS =====
app.get('/api/v1/admin/config', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      platform: { name: 'Cowors', version: '1.0.0' },
      commission: { rate: 0.15, currency: 'USD' },
      notifications: { email: true, sms: false },
      features: { reviews: true, analytics: true },
      maintenance: { enabled: false, message: '' }
    }
  });
});

app.get('/api/v1/admin/config/platform', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Cowors',
      version: '1.0.0',
      environment: 'production',
      timezone: 'UTC'
    }
  });
});

app.get('/api/v1/admin/config/commission', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      rate: 0.15,
      currency: 'USD',
      minimumAmount: 10,
      maximumAmount: 10000
    }
  });
});

app.get('/api/v1/admin/config/notifications', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      email: {
        enabled: true,
        provider: 'sendgrid',
        templates: ['welcome', 'booking_confirmation', 'payment_receipt']
      },
      sms: {
        enabled: false,
        provider: 'twilio'
      },
      push: {
        enabled: true,
        provider: 'firebase'
      }
    }
  });
});

app.get('/api/v1/admin/config/features', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      reviews: true,
      analytics: true,
      payments: true,
      notifications: true,
      multiLanguage: false,
      darkMode: true
    }
  });
});

app.get('/api/v1/admin/config/maintenance', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      enabled: false,
      message: '',
      scheduledStart: null,
      scheduledEnd: null,
      affectedServices: []
    }
  });
});

app.get('/api/v1/admin/config/backup', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      lastBackup: new Date().toISOString(),
      frequency: 'daily',
      retention: '30 days',
      status: 'completed'
    }
  });
});

app.get('/api/v1/admin/config/restore', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      availableBackups: [
        { id: 'backup-1', date: '2024-01-01', size: '2.5GB' },
        { id: 'backup-2', date: '2024-01-02', size: '2.6GB' }
      ]
    }
  });
});

// ===== ROLES & PERMISSIONS ENDPOINTS =====
app.get('/api/v1/admin/roles', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'role-1', name: 'Admin', description: 'Full system access', permissions: ['read', 'write', 'delete'] },
      { id: 'role-2', name: 'Manager', description: 'Limited admin access', permissions: ['read', 'write'] },
      { id: 'role-3', name: 'Support', description: 'Read-only access', permissions: ['read'] }
    ]
  });
});

app.get('/api/v1/admin/permissions', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'perm-1', name: 'read', description: 'Read access to resources' },
      { id: 'perm-2', name: 'write', description: 'Write access to resources' },
      { id: 'perm-3', name: 'delete', description: 'Delete access to resources' }
    ]
  });
});

// ===== AUDIT LOGS ENDPOINT =====
app.get('/api/v1/admin/audit-logs', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'log-1',
        userId: 'admin-1',
        action: 'user.create',
        resource: 'user-123',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'log-2',
        userId: 'admin-1',
        action: 'booking.update',
        resource: 'booking-456',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }
    ]
  });
});

// ===== REPORTS & EXPORT/IMPORT ENDPOINTS =====
app.post('/api/v1/admin/reports/generate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Report generation initiated',
    reportId: 'report-123',
    estimatedCompletion: '5 minutes'
  });
});

app.post('/api/v1/admin/exports/data', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Data export initiated',
    exportId: 'export-123',
    downloadUrl: '/api/v1/admin/downloads/export-123.csv'
  });
});

app.post('/api/v1/admin/imports/data', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Data import initiated',
    importId: 'import-123',
    status: 'processing'
  });
});

// Start server
app.listen(PORT, () => {
  // Silent start to satisfy linters disallowing console usage
});