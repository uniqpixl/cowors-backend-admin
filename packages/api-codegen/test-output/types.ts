// Auto-generated TypeScript types from OpenAPI specification
// Do not edit manually


export enum BookingStatus {
  "pending" = "pending",
  "confirmed" = "confirmed",
  "cancelled" = "cancelled",
  "completed" = "completed",
  "no_show" = "no_show",
  "refunded" = "refunded"
}


export interface OffsetPaginationDto {
  limit: number;
  currentPage: number;
  nextPage: number;
  previousPage: number;
  totalRecords: number;
  totalPages: number;
}


export interface OffsetPaginatedDto {
  data: any[];
  pagination: OffsetPaginationDto;
}


export interface UserEntity {

}


export interface AdminUserUpdateDto {
  status?: string;
  role?: string;
  emailVerified?: boolean;
  adminNotes?: string;
  statusReason?: string;
}


export interface AdminUserBanDto {
  reason: string;
  banDuration?: number;
}


export interface AdminUserSuspendDto {
  reason: string;
  suspensionDuration?: number;
}


export interface PlatformStatsDto {
  totalUsers: number;
  totalPartners: number;
  totalSpaces: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  newPartnersThisMonth: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  averageBookingValue: number;
  platformCommission: number;
}


export interface BookingAnalyticsDto {
  date: string;
  bookingCount: number;
  revenue: number;
  averageValue: number;
  uniqueUsers: number;
}


export interface UserAnalyticsDto {
  date: string;
  newUsers: number;
  activeUsers: number;
  firstTimeBookers: number;
}


export interface RevenueAnalyticsDto {
  date: string;
  totalRevenue: number;
  platformCommission: number;
  partnerEarnings: number;
  transactionCount: number;
}


export interface BulkKycReviewDto {
  verificationIds: string[];
  action: string;
  notes?: string;
}


export interface BulkKycReviewResultDto {
  success: boolean;
  message: string;
  summary: Record<string, any>;
  results: Record<string, any>[];
  errors: Record<string, any>[];
  processedAt: string;
  processedBy?: string;
}


export interface PartnerEntity {

}


export interface UserDto {
  id: string;
  role: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
}


export interface ErrorDetailDto {
  property?: string;
  code: string;
  message: string;
  value?: Record<string, any>;
  constraints?: Record<string, any>;
}


export interface ErrorDto {
  statusCode: number;
  error: string;
  message: string;
  errorCode?: string;
  details?: ErrorDetailDto[];
  timestamp?: string;
  path?: string;
  stack?: string;
  trace?: Record<string, any>;
}


export interface OffsetPaginatedUserDto {
  data: any[];
  pagination: OffsetPaginationDto;
}


export interface CursorPaginationDto {
  limit: number;
  afterCursor: string;
  beforeCursor: string;
  totalRecords: number;
}


export interface CursorPaginatedDto {
  data: any[];
  pagination: CursorPaginationDto;
}


export interface CursorPaginatedUserDto {
  data: any[];
  pagination: CursorPaginationDto;
}


export interface UpdateUserProfileDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}


export interface InitiateKycVerificationDto {
  provider: string;
  verificationType: string;
  bookingId?: string;
  returnUrl?: string;
}


export interface KycVerificationResponseDto {
  sessionId: string;
  verificationUrl: string;
  status: string;
  verificationId: string;
  expiresAt?: string;
}


export interface KycStatusResponseDto {
  status: string;
  provider: string;
  verificationType: string;
  completedAt?: string;
  submittedAt?: string;
  rejectionReason?: string;
  verificationResult?: Record<string, any>;
  bookingId?: string;
}


export interface KycWebhookDto {
  sessionId: string;
  status: string;
  transactionId?: string;
  verificationResult?: Record<string, any>;
  rejectionReason?: string;
}


export interface DimensionsDto {
  country?: string;
  city?: string;
  userSegment?: string;
  deviceType?: string;
  platform?: string;
  source?: string;
  campaign?: string;
  ageGroup?: string;
  gender?: string;
}


export interface BreakdownDto {
  hourly?: Record<string, any>;
  bySegment?: Record<string, any>;
  byChannel?: Record<string, any>;
  byLocation?: Record<string, any>;
  byDevice?: Record<string, any>;
}


export interface TargetsDto {
  daily?: number;
  weekly?: number;
  monthly?: number;
  quarterly?: number;
  yearly?: number;
}


export interface QualityDto {
  confidence?: number;
  completeness?: number;
  accuracy?: number;
  timeliness?: number;
  source?: string;
  methodology?: string;
}


export interface AlertsDto {
  enabled?: boolean;
  thresholds?: Record<string, any>;
  recipients?: string[];
}


export interface CreateAnalyticsDto {
  type: string;
  category: string;
  metricName: string;
  entityType?: string;
  entityId?: string;
  date: string;
  granularity?: string;
  value: number;
  previousValue?: number;
  changePercentage?: number;
  dimensions?: any;
  breakdown?: any;
  targets?: any;
  currency?: string;
  unit?: string;
  description?: string;
  quality?: any;
  alerts?: any;
  isActive?: boolean;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  collectedAt?: string;
  dataSource?: string;
  schemaVersion?: string;
}


export interface AnalyticsDto {
  id: string;
  type: string;
  category: string;
  metricName: string;
  entityType?: string;
  entityId?: string;
  date: string;
  granularity: string;
  value: number;
  previousValue?: number;
  changePercentage?: number;
  dimensions?: any;
  breakdown?: any;
  targets?: any;
  currency?: string;
  unit?: string;
  description?: string;
  quality?: any;
  alerts?: any;
  isActive: boolean;
  isPublic: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  collectedAt?: string;
  dataSource?: string;
  schemaVersion?: string;
}


export interface BulkCreateAnalyticsDto {
  records: CreateAnalyticsDto[];
  skipErrors?: boolean;
}


export interface AnalyticsStatsDto {
  total: number;
  activeMetrics: number;
  publicMetrics: number;
  byType: Record<string, any>;
  byCategory: Record<string, any>;
  byGranularity: Record<string, any>;
  dateRange: Record<string, any>;
  topMetrics: Record<string, any>[];
  qualitySummary: Record<string, any>;
}


export interface MetricTrendDto {
  metricName: string;
  dataPoints: Record<string, any>[];
  trend: Record<string, any>;
  summary: Record<string, any>;
}


export interface DashboardDto {
  kpis: Record<string, any>[];
  trends: MetricTrendDto[];
  alerts: Record<string, any>[];
  summary: Record<string, any>;
}


export interface UpdateAnalyticsDto {
  value?: number;
  previousValue?: number;
  changePercentage?: number;
  dimensions?: any;
  breakdown?: any;
  targets?: any;
  description?: string;
  quality?: any;
  alerts?: any;
  isActive?: boolean;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  dataSource?: string;
  schemaVersion?: string;
}


export interface CreateAuditLogDto {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  httpMethod?: string;
  responseStatus?: number;
  executionTime?: number;
  isSuccessful?: boolean;
  errorMessage?: string;
}


export interface AuditLogEntity {

}


export interface CreateSystemHealthDto {
  serviceName: string;
  serviceType: string;
  status: string;
  responseTime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  activeConnections?: number;
  errorRate?: number;
  throughput?: number;
  message?: string;
  metrics?: Record<string, any>;
  checkDuration?: number;
  isAlertSent?: boolean;
}


export interface SystemHealthEntity {

}


export interface CheckAvailabilityDto {
  spaceId: Record<string, any>;
  startDateTime: string;
  endDateTime: string;
}


export interface AvailabilityResponseDto {
  available: boolean;
  conflicts?: string[];
}


export interface CreateBookingDto {
  spaceId: Record<string, any>;
  startDateTime: string;
  endDateTime: string;
  guests: number;
  notes?: string;
  couponCode?: string;
}


export interface BookingDto {
  id: Record<string, any>;
  spaceId: Record<string, any>;
  userId: Record<string, any>;
  partnerId: Record<string, any>;
  startDateTime: string;
  endDateTime: string;
  guests: number;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


export interface BookingEntity {

}


export interface OffsetPaginatedBookingDto {
  data: any[];
  pagination: OffsetPaginationDto;
}


export interface CursorPaginatedBookingDto {
  data: any[];
  pagination: CursorPaginationDto;
}


export interface UpdateBookingDto {
  spaceId?: Record<string, any>;
  startDateTime?: string;
  endDateTime?: string;
  guests?: number;
  notes?: string;
  couponCode?: string;
  status?: BookingStatus;
  totalAmount?: number;
}


export interface BookingKycStatusDto {
  bookingId: string;
  kycStatus: string;
  kycVerificationId?: string;
  kycRequiredAt?: string;
  kycCompletedAt?: string;
  kycRequired: boolean;
}


export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  scope: string;
  partnerId?: string;
  status: string;
  validFrom: string;
  validTo: string;
  metadata?: Record<string, any>;
}


export interface CouponEntity {

}


export interface CouponUsageDto {
  code?: string;
  userId?: string;
  orderAmount?: number;
  bookingId?: string;
}


export interface UpdateCouponDto {
  name?: string;
  description?: string;
  type?: string;
  value?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  scope?: string;
  partnerId?: string;
  status?: string;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, any>;
}


export interface CreateNotificationDto {
  userId: string;
  type: string;
  category: string;
  priority?: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  data?: Record<string, any>;
  channels?: Record<string, any>;
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}


export interface NotificationResponseDto {
  id: string;
  notificationId: string;
  userId: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  status: string;
  referenceId?: string;
  referenceType?: string;
  data?: Record<string, any>;
  channels?: Record<string, any>;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  scheduledAt?: string;
  expiresAt?: string;
  failureReason?: string;
  retryCount?: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}


export interface BulkNotificationDto {
  userIds: string[];
  type: string;
  category: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  scheduledAt?: string;
}


export interface UpdateNotificationStatusDto {
  status: string;
  failureReason?: string;
}


export interface PeakHoursDto {
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}


export interface DateRangeDto {
  startDate: string;
  endDate: string;
  description?: string;
}


export interface DemandThresholdDto {
  occupancyPercentage: number;
  multiplier: number;
}


export interface DurationThresholdDto {
  minHours: number;
  maxHours?: number;
  multiplier: number;
}


export interface SpecialConditionDto {
  condition: string;
  value: Record<string, any>;
}


export interface PricingConditionsDto {
  peakHours?: PeakHoursDto[];
  dateRanges?: DateRangeDto[];
  demandThresholds?: DemandThresholdDto[];
  minAdvanceHours?: number;
  maxAdvanceDays?: number;
  durationThresholds?: DurationThresholdDto[];
  specialConditions?: SpecialConditionDto[];
}


export interface CreatePricingRuleDto {
  name: string;
  description?: string;
  ruleType: string;
  multiplier: number;
  isActive?: boolean;
  priority?: number;
  validFrom?: string;
  validUntil?: string;
  spaceId?: string;
  conditions: PricingConditionsDto;
  metadata?: Record<string, any>;
}


export interface PricingRuleResponseDto {
  id: string;
  partnerId: string;
  spaceId?: string;
  name: string;
  description?: string;
  ruleType: string;
  multiplier: number;
  isActive: boolean;
  priority: number;
  validFrom?: string;
  validUntil?: string;
  conditions: PricingConditionsDto;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}


export interface UpdatePricingRuleDto {
  name?: string;
  description?: string;
  multiplier?: number;
  isActive?: boolean;
  priority?: number;
  validFrom?: string;
  validUntil?: string;
  conditions?: PricingConditionsDto;
  metadata?: Record<string, any>;
}


export interface PricingCalculationRequestDto {
  spaceId: string;
  startDateTime: string;
  endDateTime: string;
  basePrice?: number;
  bookingDuration: number;
}


export interface AppliedRuleDto {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  multiplier: number;
  priceImpact: number;
  description?: string;
}


export interface PricingBreakdownDto {
  basePrice: number;
  peakHoursSurcharge?: number;
  seasonalAdjustment?: number;
  demandSurcharge?: number;
  bulkDiscount?: number;
  specialEventSurcharge?: number;
}


export interface PricingCalculationResponseDto {
  originalPrice: number;
  finalPrice: number;
  totalDiscount: number;
  totalSurcharge: number;
  appliedRules: AppliedRuleDto[];
  breakdown: PricingBreakdownDto;
}


export interface CreateContentPageDto {
  title: string;
  slug: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status?: string;
  publishedAt?: string;
  featuredImage?: string;
  excerpt?: string;
  customFields?: Record<string, any>;
  allowComments?: boolean;
  isFeatured?: boolean;
  template?: string;
  seoSettings?: Record<string, any>;
}


export interface UpdateContentPageDto {
  title?: string;
  slug?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status?: string;
  publishedAt?: string;
  featuredImage?: string;
  excerpt?: string;
  customFields?: Record<string, any>;
  allowComments?: boolean;
  isFeatured?: boolean;
  template?: string;
  seoSettings?: Record<string, any>;
}


export interface UpdateMediaDto {
  alt?: string;
  description?: string;
  folder?: string;
  isPublic?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}


export interface CreateModerationDto {
  contentType: string;
  contentId: string;
  content: string;
  authorId: string;
  action: string;
  moderationReason?: string;
  flaggedKeywords?: string[];
  toxicityScore?: number;
  metadata?: Record<string, any>;
}


export interface ContentModerationEntity {

}


export interface UpdateModerationDto {
  status: string;
  moderatorId?: string;
  moderationReason?: string;
}


export interface EvidenceDto {
  files?: string[];
  screenshots?: string[];
  communications?: string[];
  witnesses?: string[];
}


export interface CreateDisputeDto {
  type: string;
  title: string;
  description: string;
  complainantId: string;
  respondentId: string;
  bookingId?: string;
  priority?: string;
  evidence?: any;
  disputedAmount?: number;
  dueDate?: string;
  metadata?: Record<string, any>;
}


export interface DisputeDto {
  id: string;
  type: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  complainantId: string;
  respondentId: string;
  bookingId?: string;
  assignedTo?: string;
  resolvedBy?: string;
  evidence?: any;
  timeline?: string[];
  disputedAmount?: number;
  resolvedAmount?: number;
  resolution?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  escalatedAt?: string;
  dueDate?: string;
  isEscalated: boolean;
  requiresLegalAction: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface DisputeStatsDto {
  total: number;
  pending: number;
  underReview: number;
  escalated: number;
  resolved: number;
  avgResolutionTime: number;
  byType: Record<string, any>;
  byPriority: Record<string, any>;
}


export interface TimelineEventDto {
  event: string;
  timestamp: string;
  actor: string;
  details?: string;
}


export interface UpdateDisputeDto {
  type?: string;
  title?: string;
  description?: string;
  complainantId?: string;
  respondentId?: string;
  bookingId?: string;
  priority?: string;
  evidence?: any;
  disputedAmount?: number;
  dueDate?: string;
  metadata?: Record<string, any>;
  status?: string;
  assignedTo?: string;
  resolvedAmount?: number;
  resolution?: string;
  resolutionNotes?: string;
  isEscalated?: boolean;
  requiresLegalAction?: boolean;
  internalNotes?: string;
  timeline?: TimelineEventDto[];
}


export interface EscalateDisputeDto {
  reason: string;
  assignTo?: string;
  newPriority?: string;
}


export interface ResolveDisputeDto {
  resolution: string;
  resolutionNotes: string;
  resolvedAmount?: number;
}


export interface FileDto {
  originalname: string;
  filename: string;
  mimetype: string;
  size: string;
  path: string;
}


export interface CreatePayoutDto {
  partnerId: string;
  amount: number;
  commissionAmount: number;
  feeAmount?: number;
  netAmount: number;
  payoutMethod: string;
  payoutDetails?: Record<string, any>;
  periodStart: string;
  periodEnd: string;
  notes?: string;
}


export interface PayoutEntity {

}


export interface UpdatePayoutDto {
  status?: string;
  transactionDetails?: Record<string, any>;
  notes?: string;
}


export interface CreateFinancialReportDto {
  title: string;
  reportType: string;
  reportFormat: string;
  periodStart: string;
  periodEnd: string;
  filters?: Record<string, any>;
}


export interface FinancialReportEntity {

}


export interface HealthCheckDto {
  status: Record<string, any>;
  details: Record<string, any>;
}


export interface GenerateInvoiceFromBookingDto {

}


export interface InvoiceResponseDto {

}


export interface CreateInvoiceDto {

}


export interface InvoiceStatsDto {

}


export interface UpdateInvoiceDto {

}


export interface DemographicsDto {
  ageGroups?: Record<string, any>;
  incomeLevel?: string;
  touristVolume?: number;
  businessTravelers?: number;
  seasonalTrends?: Record<string, any>;
}


export interface ExpansionDto {
  targetLaunchDate?: string;
  estimatedInvestment?: number;
  expectedROI?: number;
  marketResearchStatus?: string;
  partnershipOpportunities?: string[];
  regulatoryRequirements?: string[];
  competitorAnalysis?: Record<string, any>;
}


export interface CreateLocationDto {
  name: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  type?: string;
  status?: string;
  priority?: string;
  description?: string;
  population?: number;
  timezone?: string;
  currencyCode?: string;
  languageCode?: string;
  isFeatured?: boolean;
  isTouristDestination?: boolean;
  hasAirport?: boolean;
  hasPublicTransport?: boolean;
  demographics?: any;
  expansion?: any;
  metadata?: Record<string, any>;
}


export interface LocationDto {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  type: string;
  status: string;
  priority: string;
  description?: string;
  population: number;
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  totalRevenue: number;
  averagePrice?: number;
  occupancyRate: number;
  marketDemand: number;
  competitionLevel: number;
  growthPotential: number;
  isFeatured: boolean;
  isTouristDestination: boolean;
  hasAirport: boolean;
  hasPublicTransport: boolean;
  launchDate?: string;
  createdAt: string;
  updatedAt: string;
}


export interface LocationStatsDto {
  total: number;
  active: number;
  planned: number;
  byStatus: Record<string, any>;
  byType: Record<string, any>;
  byCountry: Record<string, any>;
  avgOccupancyRate: number;
  avgMarketDemand: number;
  totalProperties: number;
  totalRevenue: number;
}


export interface UpdateLocationDto {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  status?: string;
  priority?: string;
  description?: string;
  population?: number;
  timezone?: string;
  currencyCode?: string;
  languageCode?: string;
  isFeatured?: boolean;
  isTouristDestination?: boolean;
  hasAirport?: boolean;
  hasPublicTransport?: boolean;
  demographics?: any;
  expansion?: any;
  metadata?: Record<string, any>;
  totalProperties?: number;
  activeProperties?: number;
  totalBookings?: number;
  totalRevenue?: number;
  averagePrice?: number;
  occupancyRate?: number;
  marketDemand?: number;
  competitionLevel?: number;
  growthPotential?: number;
  analytics?: any;
  launchDate?: string;
}


export interface CreateMessageDto {

}


export interface AddressDto {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: Record<string, any>;
}


export interface ContactInfoDto {
  email: string;
  phone: string;
  website?: string;
  alternatePhone?: string;
}


export interface BusinessDetailsDto {
  description?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  accountHolderName?: string;
}


export interface OperatingHoursDto {
  monday: Record<string, any>;
  tuesday: Record<string, any>;
  wednesday: Record<string, any>;
  thursday: Record<string, any>;
  friday: Record<string, any>;
  saturday: Record<string, any>;
  sunday: Record<string, any>;
}


export interface CreatePartnerDto {
  businessName: string;
  businessType: string;
  businessSubtype?: string;
  address?: AddressDto;
  contactInfo: ContactInfoDto;
  businessDetails?: BusinessDetailsDto;
  operatingHours?: OperatingHoursDto;
  commissionRate?: number;
}


export interface PartnerDto {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  businessSubtype?: string;
  address?: string;
  verificationStatus: string;
  status: string;
  rating: number;
  reviewCount: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}


export interface UpdatePartnerDto {
  businessName?: string;
  businessSubtype?: string;
  address?: AddressDto;
  contactInfo?: ContactInfoDto;
  businessDetails?: BusinessDetailsDto;
  operatingHours?: OperatingHoursDto;
  commissionRate?: number;
  status?: string;
}


export interface UpdatePartnerVerificationDto {
  verificationStatus?: string;
  verificationNotes?: string;
}


export interface CreatePartnerCommissionSettingsDto {
  partnerId: string;
  commissionRate: number;
  customRates?: Record<string, any>;
  payoutSchedule: string;
  minimumPayout: number;
}


export interface PartnerCommissionSettingsEntity {

}


export interface UpdatePartnerCommissionSettingsDto {

}


export interface CreatePaymentDto {
  userId?: string;
  bookingId: string;
  gateway: string;
  method: string;
  amount: number;
  currency: string;
  breakdown?: Record<string, any>;
  metadata?: Record<string, any>;
}


export interface CreateRefundDto {
  paymentId: string;
  type: string;
  method: string;
  amount: number;
  currency: string;
  reason: string;
  adminNotes?: string;
  breakdown?: Record<string, any>;
  metadata?: Record<string, any>;
}


export interface WalletBalanceResponseDto {
  balanceType: string;
  balance: number;
  lockedBalance: number;
  currency: string;
  lastTransactionAt?: string;
}


export interface TransactionResponseDto {
  id: string;
  transactionId: string;
  type: string;
  source: string;
  amount: number;
  balanceAfter: number;
  currency: string;
  status: string;
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  processedAt?: string;
  metadata?: Record<string, any>;
}


export interface CreateWalletTransactionDto {
  userId?: string;
  balanceType: string;
  type: string;
  source: string;
  amount: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
}


export interface LockBalanceDto {
  balanceType: string;
  amount: number;
}


export interface UnlockBalanceDto {
  balanceType: string;
  amount: number;
}


export interface ProcessRefundDto {
  amount: number;
  referenceId: string;
  description: string;
  metadata?: Record<string, any>;
}


export interface ProcessRewardDto {
  amount: number;
  source: string;
  description: string;
  metadata?: Record<string, any>;
}


export interface CreateReviewDto {
  type: string;
  reviewType?: string;
  rating: number;
  comment?: string;
  images?: string[];
  spaceId?: string;
  partnerId?: string;
  bookingId?: string;
}


export interface UpdateReviewDto {
  type?: string;
  reviewType?: string;
  rating?: number;
  comment?: string;
  images?: string[];
  spaceId?: string;
  partnerId?: string;
  bookingId?: string;
  response?: string;
}


export interface CreateRoleDto {

}


export interface RoleDto {

}


export interface UpdateRoleDto {

}


export interface SpaceLocationDto {
  floor?: string;
  room?: string;
  area?: string;
  coordinates?: Record<string, any>;
}


export interface SpacePricingDto {
  basePrice: number;
  currency: string;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  minimumBookingHours?: number;
  maximumBookingHours?: number;
}


export interface CreateSpaceDto {
  name: string;
  description: string;
  spaceType: string;
  bookingModel?: string;
  capacity: number;
  amenities: string[];
  location?: SpaceLocationDto;
  pricing: SpacePricingDto;
  images?: string[];
  availabilityRules?: Record<string, any>;
  metadata?: Record<string, any>;
}


export interface SpaceDto {
  id: Record<string, any>;
  partnerId: Record<string, any>;
  name: string;
  description: string;
  spaceType: string;
  bookingModel: string;
  capacity: number;
  amenities: string[];
  location?: SpaceLocationDto;
  pricing: SpacePricingDto;
  images?: string[];
  status: string;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
}


export interface OffsetPaginatedSpaceDto {
  data: any[];
  pagination: OffsetPaginationDto;
}


export interface CursorPaginatedSpaceDto {
  data: any[];
  pagination: CursorPaginationDto;
}


export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  spaceType?: string;
  bookingModel?: string;
  capacity?: number;
  amenities?: string[];
  location?: SpaceLocationDto;
  pricing?: SpacePricingDto;
  images?: string[];
  availabilityRules?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: string;
}


export interface CreateSystemConfigDto {

}


export interface UpdateSystemConfigDto {

}
