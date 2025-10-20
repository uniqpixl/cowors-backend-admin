import { z } from 'zod';\n\n// Auto-generated Zod schemas from OpenAPI specification\n// Do not edit manually\n\n
export const BookingStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed", "no_show", "refunded"]);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
\n
export const OffsetPaginationDtoSchema = z.object({
  limit: z.number(),
  currentPage: z.number(),
  nextPage: z.number(),
  previousPage: z.number(),
  totalRecords: z.number(),
  totalPages: z.number(),
});
export type OffsetPaginationDto = z.infer<typeof OffsetPaginationDtoSchema>;
\n
export const OffsetPaginatedDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: OffsetPaginationDtoSchema,
});
export type OffsetPaginatedDto = z.infer<typeof OffsetPaginatedDtoSchema>;
\n
export const UserEntitySchema = z.object({

});
export type UserEntity = z.infer<typeof UserEntitySchema>;
\n
export const AdminUserUpdateDtoSchema = z.object({
  status: z.string().optional(),
  role: z.string().optional(),
  emailVerified: z.boolean().optional(),
  adminNotes: z.string().optional(),
  statusReason: z.string().optional(),
});
export type AdminUserUpdateDto = z.infer<typeof AdminUserUpdateDtoSchema>;
\n
export const AdminUserBanDtoSchema = z.object({
  reason: z.string(),
  banDuration: z.number().optional(),
});
export type AdminUserBanDto = z.infer<typeof AdminUserBanDtoSchema>;
\n
export const AdminUserSuspendDtoSchema = z.object({
  reason: z.string(),
  suspensionDuration: z.number().optional(),
});
export type AdminUserSuspendDto = z.infer<typeof AdminUserSuspendDtoSchema>;
\n
export const PlatformStatsDtoSchema = z.object({
  totalUsers: z.number(),
  totalPartners: z.number(),
  totalSpaces: z.number(),
  totalBookings: z.number(),
  totalRevenue: z.number(),
  activeUsers: z.number(),
  newUsersThisMonth: z.number(),
  newPartnersThisMonth: z.number(),
  bookingsThisMonth: z.number(),
  revenueThisMonth: z.number(),
  averageBookingValue: z.number(),
  platformCommission: z.number(),
});
export type PlatformStatsDto = z.infer<typeof PlatformStatsDtoSchema>;
\n
export const BookingAnalyticsDtoSchema = z.object({
  date: z.string(),
  bookingCount: z.number(),
  revenue: z.number(),
  averageValue: z.number(),
  uniqueUsers: z.number(),
});
export type BookingAnalyticsDto = z.infer<typeof BookingAnalyticsDtoSchema>;
\n
export const UserAnalyticsDtoSchema = z.object({
  date: z.string(),
  newUsers: z.number(),
  activeUsers: z.number(),
  firstTimeBookers: z.number(),
});
export type UserAnalyticsDto = z.infer<typeof UserAnalyticsDtoSchema>;
\n
export const RevenueAnalyticsDtoSchema = z.object({
  date: z.string(),
  totalRevenue: z.number(),
  platformCommission: z.number(),
  partnerEarnings: z.number(),
  transactionCount: z.number(),
});
export type RevenueAnalyticsDto = z.infer<typeof RevenueAnalyticsDtoSchema>;
\n
export const BulkKycReviewDtoSchema = z.object({
  verificationIds: z.array(z.string()),
  action: z.string(),
  notes: z.string().optional(),
});
export type BulkKycReviewDto = z.infer<typeof BulkKycReviewDtoSchema>;
\n
export const BulkKycReviewResultDtoSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  summary: z.record(z.any()),
  results: z.array(z.record(z.any())),
  errors: z.array(z.record(z.any())),
  processedAt: z.string().datetime(),
  processedBy: z.string().optional(),
});
export type BulkKycReviewResultDto = z.infer<typeof BulkKycReviewResultDtoSchema>;
\n
export const PartnerEntitySchema = z.object({

});
export type PartnerEntity = z.infer<typeof PartnerEntitySchema>;
\n
export const UserDtoSchema = z.object({
  id: z.string(),
  role: z.string(),
  username: z.string(),
  email: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  image: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  bio: z.string().optional(),
});
export type UserDto = z.infer<typeof UserDtoSchema>;
\n
export const ErrorDetailDtoSchema = z.object({
  property: z.string().optional(),
  code: z.string(),
  message: z.string(),
  value: z.record(z.any()).optional(),
  constraints: z.record(z.any()).optional(),
});
export type ErrorDetailDto = z.infer<typeof ErrorDetailDtoSchema>;
\n
export const ErrorDtoSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  errorCode: z.string().optional(),
  details: z.array(ErrorDetailDtoSchema).optional(),
  timestamp: z.string().optional(),
  path: z.string().optional(),
  stack: z.string().optional(),
  trace: z.record(z.any()).optional(),
});
export type ErrorDto = z.infer<typeof ErrorDtoSchema>;
\n
export const OffsetPaginatedUserDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: OffsetPaginationDtoSchema,
});
export type OffsetPaginatedUserDto = z.infer<typeof OffsetPaginatedUserDtoSchema>;
\n
export const CursorPaginationDtoSchema = z.object({
  limit: z.number(),
  afterCursor: z.string(),
  beforeCursor: z.string(),
  totalRecords: z.number(),
});
export type CursorPaginationDto = z.infer<typeof CursorPaginationDtoSchema>;
\n
export const CursorPaginatedDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: CursorPaginationDtoSchema,
});
export type CursorPaginatedDto = z.infer<typeof CursorPaginatedDtoSchema>;
\n
export const CursorPaginatedUserDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: CursorPaginationDtoSchema,
});
export type CursorPaginatedUserDto = z.infer<typeof CursorPaginatedUserDtoSchema>;
\n
export const UpdateUserProfileDtoSchema = z.object({
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  image: z.string().optional(),
});
export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileDtoSchema>;
\n
export const InitiateKycVerificationDtoSchema = z.object({
  provider: z.string(),
  verificationType: z.string(),
  bookingId: z.string().optional(),
  returnUrl: z.string().optional(),
});
export type InitiateKycVerificationDto = z.infer<typeof InitiateKycVerificationDtoSchema>;
\n
export const KycVerificationResponseDtoSchema = z.object({
  sessionId: z.string(),
  verificationUrl: z.string(),
  status: z.string(),
  verificationId: z.string(),
  expiresAt: z.string().datetime().optional(),
});
export type KycVerificationResponseDto = z.infer<typeof KycVerificationResponseDtoSchema>;
\n
export const KycStatusResponseDtoSchema = z.object({
  status: z.string(),
  provider: z.string(),
  verificationType: z.string(),
  completedAt: z.string().datetime().optional(),
  submittedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  verificationResult: z.record(z.any()).optional(),
  bookingId: z.string().optional(),
});
export type KycStatusResponseDto = z.infer<typeof KycStatusResponseDtoSchema>;
\n
export const KycWebhookDtoSchema = z.object({
  sessionId: z.string(),
  status: z.string(),
  transactionId: z.string().optional(),
  verificationResult: z.record(z.any()).optional(),
  rejectionReason: z.string().optional(),
});
export type KycWebhookDto = z.infer<typeof KycWebhookDtoSchema>;
\n
export const DimensionsDtoSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  userSegment: z.string().optional(),
  deviceType: z.string().optional(),
  platform: z.string().optional(),
  source: z.string().optional(),
  campaign: z.string().optional(),
  ageGroup: z.string().optional(),
  gender: z.string().optional(),
});
export type DimensionsDto = z.infer<typeof DimensionsDtoSchema>;
\n
export const BreakdownDtoSchema = z.object({
  hourly: z.record(z.any()).optional(),
  bySegment: z.record(z.any()).optional(),
  byChannel: z.record(z.any()).optional(),
  byLocation: z.record(z.any()).optional(),
  byDevice: z.record(z.any()).optional(),
});
export type BreakdownDto = z.infer<typeof BreakdownDtoSchema>;
\n
export const TargetsDtoSchema = z.object({
  daily: z.number().optional(),
  weekly: z.number().optional(),
  monthly: z.number().optional(),
  quarterly: z.number().optional(),
  yearly: z.number().optional(),
});
export type TargetsDto = z.infer<typeof TargetsDtoSchema>;
\n
export const QualityDtoSchema = z.object({
  confidence: z.number().optional(),
  completeness: z.number().optional(),
  accuracy: z.number().optional(),
  timeliness: z.number().optional(),
  source: z.string().optional(),
  methodology: z.string().optional(),
});
export type QualityDto = z.infer<typeof QualityDtoSchema>;
\n
export const AlertsDtoSchema = z.object({
  enabled: z.boolean().optional(),
  thresholds: z.record(z.any()).optional(),
  recipients: z.array(z.string()).optional(),
});
export type AlertsDto = z.infer<typeof AlertsDtoSchema>;
\n
export const CreateAnalyticsDtoSchema = z.object({
  type: z.string(),
  category: z.string(),
  metricName: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  date: z.string(),
  granularity: z.string().optional(),
  value: z.number(),
  previousValue: z.number().optional(),
  changePercentage: z.number().optional(),
  dimensions: z.any().optional(),
  breakdown: z.any().optional(),
  targets: z.any().optional(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  quality: z.any().optional(),
  alerts: z.any().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  collectedAt: z.string().optional(),
  dataSource: z.string().optional(),
  schemaVersion: z.string().optional(),
});
export type CreateAnalyticsDto = z.infer<typeof CreateAnalyticsDtoSchema>;
\n
export const AnalyticsDtoSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: z.string(),
  metricName: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  date: z.string().datetime(),
  granularity: z.string(),
  value: z.number(),
  previousValue: z.number().optional(),
  changePercentage: z.number().optional(),
  dimensions: z.any().optional(),
  breakdown: z.any().optional(),
  targets: z.any().optional(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  quality: z.any().optional(),
  alerts: z.any().optional(),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  collectedAt: z.string().datetime().optional(),
  dataSource: z.string().optional(),
  schemaVersion: z.string().optional(),
});
export type AnalyticsDto = z.infer<typeof AnalyticsDtoSchema>;
\n
export const BulkCreateAnalyticsDtoSchema = z.object({
  records: z.array(CreateAnalyticsDtoSchema),
  skipErrors: z.boolean().optional(),
});
export type BulkCreateAnalyticsDto = z.infer<typeof BulkCreateAnalyticsDtoSchema>;
\n
export const AnalyticsStatsDtoSchema = z.object({
  total: z.number(),
  activeMetrics: z.number(),
  publicMetrics: z.number(),
  byType: z.record(z.any()),
  byCategory: z.record(z.any()),
  byGranularity: z.record(z.any()),
  dateRange: z.record(z.any()),
  topMetrics: z.array(z.record(z.any())),
  qualitySummary: z.record(z.any()),
});
export type AnalyticsStatsDto = z.infer<typeof AnalyticsStatsDtoSchema>;
\n
export const MetricTrendDtoSchema = z.object({
  metricName: z.string(),
  dataPoints: z.array(z.record(z.any())),
  trend: z.record(z.any()),
  summary: z.record(z.any()),
});
export type MetricTrendDto = z.infer<typeof MetricTrendDtoSchema>;
\n
export const DashboardDtoSchema = z.object({
  kpis: z.array(z.record(z.any())),
  trends: z.array(MetricTrendDtoSchema),
  alerts: z.array(z.record(z.any())),
  summary: z.record(z.any()),
});
export type DashboardDto = z.infer<typeof DashboardDtoSchema>;
\n
export const UpdateAnalyticsDtoSchema = z.object({
  value: z.number().optional(),
  previousValue: z.number().optional(),
  changePercentage: z.number().optional(),
  dimensions: z.any().optional(),
  breakdown: z.any().optional(),
  targets: z.any().optional(),
  description: z.string().optional(),
  quality: z.any().optional(),
  alerts: z.any().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  dataSource: z.string().optional(),
  schemaVersion: z.string().optional(),
});
export type UpdateAnalyticsDto = z.infer<typeof UpdateAnalyticsDtoSchema>;
\n
export const CreateAuditLogDtoSchema = z.object({
  userId: z.string().optional(),
  action: z.string(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  description: z.string().optional(),
  oldValues: z.record(z.any()).optional(),
  newValues: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  severity: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  endpoint: z.string().optional(),
  httpMethod: z.string().optional(),
  responseStatus: z.number().optional(),
  executionTime: z.number().optional(),
  isSuccessful: z.boolean().optional(),
  errorMessage: z.string().optional(),
});
export type CreateAuditLogDto = z.infer<typeof CreateAuditLogDtoSchema>;
\n
export const AuditLogEntitySchema = z.object({

});
export type AuditLogEntity = z.infer<typeof AuditLogEntitySchema>;
\n
export const CreateSystemHealthDtoSchema = z.object({
  serviceName: z.string(),
  serviceType: z.string(),
  status: z.string(),
  responseTime: z.number().optional(),
  cpuUsage: z.number().optional(),
  memoryUsage: z.number().optional(),
  diskUsage: z.number().optional(),
  activeConnections: z.number().optional(),
  errorRate: z.number().optional(),
  throughput: z.number().optional(),
  message: z.string().optional(),
  metrics: z.record(z.any()).optional(),
  checkDuration: z.number().optional(),
  isAlertSent: z.boolean().optional(),
});
export type CreateSystemHealthDto = z.infer<typeof CreateSystemHealthDtoSchema>;
\n
export const SystemHealthEntitySchema = z.object({

});
export type SystemHealthEntity = z.infer<typeof SystemHealthEntitySchema>;
\n
export const CheckAvailabilityDtoSchema = z.object({
  spaceId: z.record(z.any()),
  startDateTime: z.string(),
  endDateTime: z.string(),
});
export type CheckAvailabilityDto = z.infer<typeof CheckAvailabilityDtoSchema>;
\n
export const AvailabilityResponseDtoSchema = z.object({
  available: z.boolean(),
  conflicts: z.array(z.string()).optional(),
});
export type AvailabilityResponseDto = z.infer<typeof AvailabilityResponseDtoSchema>;
\n
export const CreateBookingDtoSchema = z.object({
  spaceId: z.record(z.any()),
  startDateTime: z.string(),
  endDateTime: z.string(),
  guests: z.number(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});
export type CreateBookingDto = z.infer<typeof CreateBookingDtoSchema>;
\n
export const BookingDtoSchema = z.object({
  id: z.record(z.any()),
  spaceId: z.record(z.any()),
  userId: z.record(z.any()),
  partnerId: z.record(z.any()),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  guests: z.number(),
  status: BookingStatusSchema,
  totalAmount: z.number(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type BookingDto = z.infer<typeof BookingDtoSchema>;
\n
export const BookingEntitySchema = z.object({

});
export type BookingEntity = z.infer<typeof BookingEntitySchema>;
\n
export const OffsetPaginatedBookingDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: OffsetPaginationDtoSchema,
});
export type OffsetPaginatedBookingDto = z.infer<typeof OffsetPaginatedBookingDtoSchema>;
\n
export const CursorPaginatedBookingDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: CursorPaginationDtoSchema,
});
export type CursorPaginatedBookingDto = z.infer<typeof CursorPaginatedBookingDtoSchema>;
\n
export const UpdateBookingDtoSchema = z.object({
  spaceId: z.record(z.any()).optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  guests: z.number().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
  status: BookingStatusSchema.optional(),
  totalAmount: z.number().optional(),
});
export type UpdateBookingDto = z.infer<typeof UpdateBookingDtoSchema>;
\n
export const BookingKycStatusDtoSchema = z.object({
  bookingId: z.string(),
  kycStatus: z.string(),
  kycVerificationId: z.string().optional(),
  kycRequiredAt: z.string().datetime().optional(),
  kycCompletedAt: z.string().datetime().optional(),
  kycRequired: z.boolean(),
});
export type BookingKycStatusDto = z.infer<typeof BookingKycStatusDtoSchema>;
\n
export const CreateCouponDtoSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  value: z.number(),
  minOrderValue: z.number().optional(),
  maxDiscountAmount: z.number().optional(),
  usageLimit: z.number().optional(),
  userUsageLimit: z.number().optional(),
  scope: z.string(),
  partnerId: z.string().optional(),
  status: z.string(),
  validFrom: z.string(),
  validTo: z.string(),
  metadata: z.record(z.any()).optional(),
});
export type CreateCouponDto = z.infer<typeof CreateCouponDtoSchema>;
\n
export const CouponEntitySchema = z.object({

});
export type CouponEntity = z.infer<typeof CouponEntitySchema>;
\n
export const CouponUsageDtoSchema = z.object({
  code: z.string().optional(),
  userId: z.string().optional(),
  orderAmount: z.number().optional(),
  bookingId: z.string().optional(),
});
export type CouponUsageDto = z.infer<typeof CouponUsageDtoSchema>;
\n
export const UpdateCouponDtoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  value: z.number().optional(),
  minOrderValue: z.number().optional(),
  maxDiscountAmount: z.number().optional(),
  usageLimit: z.number().optional(),
  userUsageLimit: z.number().optional(),
  scope: z.string().optional(),
  partnerId: z.string().optional(),
  status: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type UpdateCouponDto = z.infer<typeof UpdateCouponDtoSchema>;
\n
export const CreateNotificationDtoSchema = z.object({
  userId: z.string(),
  type: z.string(),
  category: z.string(),
  priority: z.string().optional(),
  title: z.string(),
  message: z.string(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  data: z.record(z.any()).optional(),
  channels: z.record(z.any()).optional(),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateNotificationDto = z.infer<typeof CreateNotificationDtoSchema>;
\n
export const NotificationResponseDtoSchema = z.object({
  id: z.string(),
  notificationId: z.string(),
  userId: z.string(),
  type: z.string(),
  category: z.string(),
  priority: z.string(),
  title: z.string(),
  message: z.string(),
  status: z.string(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  data: z.record(z.any()).optional(),
  channels: z.record(z.any()).optional(),
  sentAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  failureReason: z.string().optional(),
  retryCount: z.number().optional(),
  maxRetries: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type NotificationResponseDto = z.infer<typeof NotificationResponseDtoSchema>;
\n
export const BulkNotificationDtoSchema = z.object({
  userIds: z.array(z.string()),
  type: z.string(),
  category: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  scheduledAt: z.string().optional(),
});
export type BulkNotificationDto = z.infer<typeof BulkNotificationDtoSchema>;
\n
export const UpdateNotificationStatusDtoSchema = z.object({
  status: z.string(),
  failureReason: z.string().optional(),
});
export type UpdateNotificationStatusDto = z.infer<typeof UpdateNotificationStatusDtoSchema>;
\n
export const PeakHoursDtoSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  daysOfWeek: z.array(z.number()),
});
export type PeakHoursDto = z.infer<typeof PeakHoursDtoSchema>;
\n
export const DateRangeDtoSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().optional(),
});
export type DateRangeDto = z.infer<typeof DateRangeDtoSchema>;
\n
export const DemandThresholdDtoSchema = z.object({
  occupancyPercentage: z.number(),
  multiplier: z.number(),
});
export type DemandThresholdDto = z.infer<typeof DemandThresholdDtoSchema>;
\n
export const DurationThresholdDtoSchema = z.object({
  minHours: z.number(),
  maxHours: z.number().optional(),
  multiplier: z.number(),
});
export type DurationThresholdDto = z.infer<typeof DurationThresholdDtoSchema>;
\n
export const SpecialConditionDtoSchema = z.object({
  condition: z.string(),
  value: z.record(z.any()),
});
export type SpecialConditionDto = z.infer<typeof SpecialConditionDtoSchema>;
\n
export const PricingConditionsDtoSchema = z.object({
  peakHours: z.array(PeakHoursDtoSchema).optional(),
  dateRanges: z.array(DateRangeDtoSchema).optional(),
  demandThresholds: z.array(DemandThresholdDtoSchema).optional(),
  minAdvanceHours: z.number().optional(),
  maxAdvanceDays: z.number().optional(),
  durationThresholds: z.array(DurationThresholdDtoSchema).optional(),
  specialConditions: z.array(SpecialConditionDtoSchema).optional(),
});
export type PricingConditionsDto = z.infer<typeof PricingConditionsDtoSchema>;
\n
export const CreatePricingRuleDtoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  ruleType: z.string(),
  multiplier: z.number(),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  spaceId: z.string().optional(),
  conditions: PricingConditionsDtoSchema,
  metadata: z.record(z.any()).optional(),
});
export type CreatePricingRuleDto = z.infer<typeof CreatePricingRuleDtoSchema>;
\n
export const PricingRuleResponseDtoSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  spaceId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  ruleType: z.string(),
  multiplier: z.number(),
  isActive: z.boolean(),
  priority: z.number(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  conditions: PricingConditionsDtoSchema,
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PricingRuleResponseDto = z.infer<typeof PricingRuleResponseDtoSchema>;
\n
export const UpdatePricingRuleDtoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  multiplier: z.number().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  conditions: PricingConditionsDtoSchema.optional(),
  metadata: z.record(z.any()).optional(),
});
export type UpdatePricingRuleDto = z.infer<typeof UpdatePricingRuleDtoSchema>;
\n
export const PricingCalculationRequestDtoSchema = z.object({
  spaceId: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  basePrice: z.number().optional(),
  bookingDuration: z.number(),
});
export type PricingCalculationRequestDto = z.infer<typeof PricingCalculationRequestDtoSchema>;
\n
export const AppliedRuleDtoSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  ruleType: z.string(),
  multiplier: z.number(),
  priceImpact: z.number(),
  description: z.string().optional(),
});
export type AppliedRuleDto = z.infer<typeof AppliedRuleDtoSchema>;
\n
export const PricingBreakdownDtoSchema = z.object({
  basePrice: z.number(),
  peakHoursSurcharge: z.number().optional(),
  seasonalAdjustment: z.number().optional(),
  demandSurcharge: z.number().optional(),
  bulkDiscount: z.number().optional(),
  specialEventSurcharge: z.number().optional(),
});
export type PricingBreakdownDto = z.infer<typeof PricingBreakdownDtoSchema>;
\n
export const PricingCalculationResponseDtoSchema = z.object({
  originalPrice: z.number(),
  finalPrice: z.number(),
  totalDiscount: z.number(),
  totalSurcharge: z.number(),
  appliedRules: z.array(AppliedRuleDtoSchema),
  breakdown: PricingBreakdownDtoSchema,
});
export type PricingCalculationResponseDto = z.infer<typeof PricingCalculationResponseDtoSchema>;
\n
export const CreateContentPageDtoSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  status: z.string().optional(),
  publishedAt: z.string().optional(),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  allowComments: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  template: z.string().optional(),
  seoSettings: z.record(z.any()).optional(),
});
export type CreateContentPageDto = z.infer<typeof CreateContentPageDtoSchema>;
\n
export const UpdateContentPageDtoSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  status: z.string().optional(),
  publishedAt: z.string().optional(),
  featuredImage: z.string().optional(),
  excerpt: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  allowComments: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  template: z.string().optional(),
  seoSettings: z.record(z.any()).optional(),
});
export type UpdateContentPageDto = z.infer<typeof UpdateContentPageDtoSchema>;
\n
export const UpdateMediaDtoSchema = z.object({
  alt: z.string().optional(),
  description: z.string().optional(),
  folder: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});
export type UpdateMediaDto = z.infer<typeof UpdateMediaDtoSchema>;
\n
export const CreateModerationDtoSchema = z.object({
  contentType: z.string(),
  contentId: z.string(),
  content: z.string(),
  authorId: z.string(),
  action: z.string(),
  moderationReason: z.string().optional(),
  flaggedKeywords: z.array(z.string()).optional(),
  toxicityScore: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateModerationDto = z.infer<typeof CreateModerationDtoSchema>;
\n
export const ContentModerationEntitySchema = z.object({

});
export type ContentModerationEntity = z.infer<typeof ContentModerationEntitySchema>;
\n
export const UpdateModerationDtoSchema = z.object({
  status: z.string(),
  moderatorId: z.string().optional(),
  moderationReason: z.string().optional(),
});
export type UpdateModerationDto = z.infer<typeof UpdateModerationDtoSchema>;
\n
export const EvidenceDtoSchema = z.object({
  files: z.array(z.string()).optional(),
  screenshots: z.array(z.string()).optional(),
  communications: z.array(z.string()).optional(),
  witnesses: z.array(z.string()).optional(),
});
export type EvidenceDto = z.infer<typeof EvidenceDtoSchema>;
\n
export const CreateDisputeDtoSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string(),
  complainantId: z.string(),
  respondentId: z.string(),
  bookingId: z.string().optional(),
  priority: z.string().optional(),
  evidence: z.any().optional(),
  disputedAmount: z.number().optional(),
  dueDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateDisputeDto = z.infer<typeof CreateDisputeDtoSchema>;
\n
export const DisputeDtoSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
  priority: z.string(),
  title: z.string(),
  description: z.string(),
  complainantId: z.string(),
  respondentId: z.string(),
  bookingId: z.string().optional(),
  assignedTo: z.string().optional(),
  resolvedBy: z.string().optional(),
  evidence: z.any().optional(),
  timeline: z.array(z.string()).optional(),
  disputedAmount: z.number().optional(),
  resolvedAmount: z.number().optional(),
  resolution: z.string().optional(),
  resolutionNotes: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
  escalatedAt: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  isEscalated: z.boolean(),
  requiresLegalAction: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DisputeDto = z.infer<typeof DisputeDtoSchema>;
\n
export const DisputeStatsDtoSchema = z.object({
  total: z.number(),
  pending: z.number(),
  underReview: z.number(),
  escalated: z.number(),
  resolved: z.number(),
  avgResolutionTime: z.number(),
  byType: z.record(z.any()),
  byPriority: z.record(z.any()),
});
export type DisputeStatsDto = z.infer<typeof DisputeStatsDtoSchema>;
\n
export const TimelineEventDtoSchema = z.object({
  event: z.string(),
  timestamp: z.string().datetime(),
  actor: z.string(),
  details: z.string().optional(),
});
export type TimelineEventDto = z.infer<typeof TimelineEventDtoSchema>;
\n
export const UpdateDisputeDtoSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  complainantId: z.string().optional(),
  respondentId: z.string().optional(),
  bookingId: z.string().optional(),
  priority: z.string().optional(),
  evidence: z.any().optional(),
  disputedAmount: z.number().optional(),
  dueDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  resolvedAmount: z.number().optional(),
  resolution: z.string().optional(),
  resolutionNotes: z.string().optional(),
  isEscalated: z.boolean().optional(),
  requiresLegalAction: z.boolean().optional(),
  internalNotes: z.string().optional(),
  timeline: z.array(TimelineEventDtoSchema).optional(),
});
export type UpdateDisputeDto = z.infer<typeof UpdateDisputeDtoSchema>;
\n
export const EscalateDisputeDtoSchema = z.object({
  reason: z.string(),
  assignTo: z.string().optional(),
  newPriority: z.string().optional(),
});
export type EscalateDisputeDto = z.infer<typeof EscalateDisputeDtoSchema>;
\n
export const ResolveDisputeDtoSchema = z.object({
  resolution: z.string(),
  resolutionNotes: z.string(),
  resolvedAmount: z.number().optional(),
});
export type ResolveDisputeDto = z.infer<typeof ResolveDisputeDtoSchema>;
\n
export const FileDtoSchema = z.object({
  originalname: z.string(),
  filename: z.string(),
  mimetype: z.string(),
  size: z.string(),
  path: z.string(),
});
export type FileDto = z.infer<typeof FileDtoSchema>;
\n
export const CreatePayoutDtoSchema = z.object({
  partnerId: z.string(),
  amount: z.number(),
  commissionAmount: z.number(),
  feeAmount: z.number().optional(),
  netAmount: z.number(),
  payoutMethod: z.string(),
  payoutDetails: z.record(z.any()).optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
  notes: z.string().optional(),
});
export type CreatePayoutDto = z.infer<typeof CreatePayoutDtoSchema>;
\n
export const PayoutEntitySchema = z.object({

});
export type PayoutEntity = z.infer<typeof PayoutEntitySchema>;
\n
export const UpdatePayoutDtoSchema = z.object({
  status: z.string().optional(),
  transactionDetails: z.record(z.any()).optional(),
  notes: z.string().optional(),
});
export type UpdatePayoutDto = z.infer<typeof UpdatePayoutDtoSchema>;
\n
export const CreateFinancialReportDtoSchema = z.object({
  title: z.string(),
  reportType: z.string(),
  reportFormat: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  filters: z.record(z.any()).optional(),
});
export type CreateFinancialReportDto = z.infer<typeof CreateFinancialReportDtoSchema>;
\n
export const FinancialReportEntitySchema = z.object({

});
export type FinancialReportEntity = z.infer<typeof FinancialReportEntitySchema>;
\n
export const HealthCheckDtoSchema = z.object({
  status: z.record(z.any()),
  details: z.record(z.any()),
});
export type HealthCheckDto = z.infer<typeof HealthCheckDtoSchema>;
\n
export const GenerateInvoiceFromBookingDtoSchema = z.object({

});
export type GenerateInvoiceFromBookingDto = z.infer<typeof GenerateInvoiceFromBookingDtoSchema>;
\n
export const InvoiceResponseDtoSchema = z.object({

});
export type InvoiceResponseDto = z.infer<typeof InvoiceResponseDtoSchema>;
\n
export const CreateInvoiceDtoSchema = z.object({

});
export type CreateInvoiceDto = z.infer<typeof CreateInvoiceDtoSchema>;
\n
export const InvoiceStatsDtoSchema = z.object({

});
export type InvoiceStatsDto = z.infer<typeof InvoiceStatsDtoSchema>;
\n
export const UpdateInvoiceDtoSchema = z.object({

});
export type UpdateInvoiceDto = z.infer<typeof UpdateInvoiceDtoSchema>;
\n
export const DemographicsDtoSchema = z.object({
  ageGroups: z.record(z.any()).optional(),
  incomeLevel: z.string().optional(),
  touristVolume: z.number().optional(),
  businessTravelers: z.number().optional(),
  seasonalTrends: z.record(z.any()).optional(),
});
export type DemographicsDto = z.infer<typeof DemographicsDtoSchema>;
\n
export const ExpansionDtoSchema = z.object({
  targetLaunchDate: z.string().datetime().optional(),
  estimatedInvestment: z.number().optional(),
  expectedROI: z.number().optional(),
  marketResearchStatus: z.string().optional(),
  partnershipOpportunities: z.array(z.string()).optional(),
  regulatoryRequirements: z.array(z.string()).optional(),
  competitorAnalysis: z.record(z.any()).optional(),
});
export type ExpansionDto = z.infer<typeof ExpansionDtoSchema>;
\n
export const CreateLocationDtoSchema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  countryCode: z.string(),
  postalCode: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  description: z.string().optional(),
  population: z.number().optional(),
  timezone: z.string().optional(),
  currencyCode: z.string().optional(),
  languageCode: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isTouristDestination: z.boolean().optional(),
  hasAirport: z.boolean().optional(),
  hasPublicTransport: z.boolean().optional(),
  demographics: z.any().optional(),
  expansion: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateLocationDto = z.infer<typeof CreateLocationDtoSchema>;
\n
export const LocationDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  countryCode: z.string(),
  postalCode: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  type: z.string(),
  status: z.string(),
  priority: z.string(),
  description: z.string().optional(),
  population: z.number(),
  totalProperties: z.number(),
  activeProperties: z.number(),
  totalBookings: z.number(),
  totalRevenue: z.number(),
  averagePrice: z.number().optional(),
  occupancyRate: z.number(),
  marketDemand: z.number(),
  competitionLevel: z.number(),
  growthPotential: z.number(),
  isFeatured: z.boolean(),
  isTouristDestination: z.boolean(),
  hasAirport: z.boolean(),
  hasPublicTransport: z.boolean(),
  launchDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LocationDto = z.infer<typeof LocationDtoSchema>;
\n
export const LocationStatsDtoSchema = z.object({
  total: z.number(),
  active: z.number(),
  planned: z.number(),
  byStatus: z.record(z.any()),
  byType: z.record(z.any()),
  byCountry: z.record(z.any()),
  avgOccupancyRate: z.number(),
  avgMarketDemand: z.number(),
  totalProperties: z.number(),
  totalRevenue: z.number(),
});
export type LocationStatsDto = z.infer<typeof LocationStatsDtoSchema>;
\n
export const UpdateLocationDtoSchema = z.object({
  name: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  description: z.string().optional(),
  population: z.number().optional(),
  timezone: z.string().optional(),
  currencyCode: z.string().optional(),
  languageCode: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isTouristDestination: z.boolean().optional(),
  hasAirport: z.boolean().optional(),
  hasPublicTransport: z.boolean().optional(),
  demographics: z.any().optional(),
  expansion: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  totalProperties: z.number().optional(),
  activeProperties: z.number().optional(),
  totalBookings: z.number().optional(),
  totalRevenue: z.number().optional(),
  averagePrice: z.number().optional(),
  occupancyRate: z.number().optional(),
  marketDemand: z.number().optional(),
  competitionLevel: z.number().optional(),
  growthPotential: z.number().optional(),
  analytics: z.any().optional(),
  launchDate: z.string().datetime().optional(),
});
export type UpdateLocationDto = z.infer<typeof UpdateLocationDtoSchema>;
\n
export const CreateMessageDtoSchema = z.object({

});
export type CreateMessageDto = z.infer<typeof CreateMessageDtoSchema>;
\n
export const AddressDtoSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  coordinates: z.record(z.any()).optional(),
});
export type AddressDto = z.infer<typeof AddressDtoSchema>;
\n
export const ContactInfoDtoSchema = z.object({
  email: z.string(),
  phone: z.string(),
  website: z.string().optional(),
  alternatePhone: z.string().optional(),
});
export type ContactInfoDto = z.infer<typeof ContactInfoDtoSchema>;
\n
export const BusinessDetailsDtoSchema = z.object({
  description: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
});
export type BusinessDetailsDto = z.infer<typeof BusinessDetailsDtoSchema>;
\n
export const OperatingHoursDtoSchema = z.object({
  monday: z.record(z.any()),
  tuesday: z.record(z.any()),
  wednesday: z.record(z.any()),
  thursday: z.record(z.any()),
  friday: z.record(z.any()),
  saturday: z.record(z.any()),
  sunday: z.record(z.any()),
});
export type OperatingHoursDto = z.infer<typeof OperatingHoursDtoSchema>;
\n
export const CreatePartnerDtoSchema = z.object({
  businessName: z.string(),
  businessType: z.string(),
  businessSubtype: z.string().optional(),
  address: AddressDtoSchema.optional(),
  contactInfo: ContactInfoDtoSchema,
  businessDetails: BusinessDetailsDtoSchema.optional(),
  operatingHours: OperatingHoursDtoSchema.optional(),
  commissionRate: z.number().optional(),
});
export type CreatePartnerDto = z.infer<typeof CreatePartnerDtoSchema>;
\n
export const PartnerDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  businessName: z.string(),
  businessType: z.string(),
  businessSubtype: z.string().optional(),
  address: z.string().optional(),
  verificationStatus: z.string(),
  status: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  commissionRate: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PartnerDto = z.infer<typeof PartnerDtoSchema>;
\n
export const UpdatePartnerDtoSchema = z.object({
  businessName: z.string().optional(),
  businessSubtype: z.string().optional(),
  address: AddressDtoSchema.optional(),
  contactInfo: ContactInfoDtoSchema.optional(),
  businessDetails: BusinessDetailsDtoSchema.optional(),
  operatingHours: OperatingHoursDtoSchema.optional(),
  commissionRate: z.number().optional(),
  status: z.string().optional(),
});
export type UpdatePartnerDto = z.infer<typeof UpdatePartnerDtoSchema>;
\n
export const UpdatePartnerVerificationDtoSchema = z.object({
  verificationStatus: z.string().optional(),
  verificationNotes: z.string().optional(),
});
export type UpdatePartnerVerificationDto = z.infer<typeof UpdatePartnerVerificationDtoSchema>;
\n
export const CreatePartnerCommissionSettingsDtoSchema = z.object({
  partnerId: z.string(),
  commissionRate: z.number(),
  customRates: z.record(z.any()).optional(),
  payoutSchedule: z.string(),
  minimumPayout: z.number(),
});
export type CreatePartnerCommissionSettingsDto = z.infer<typeof CreatePartnerCommissionSettingsDtoSchema>;
\n
export const PartnerCommissionSettingsEntitySchema = z.object({

});
export type PartnerCommissionSettingsEntity = z.infer<typeof PartnerCommissionSettingsEntitySchema>;
\n
export const UpdatePartnerCommissionSettingsDtoSchema = z.object({

});
export type UpdatePartnerCommissionSettingsDto = z.infer<typeof UpdatePartnerCommissionSettingsDtoSchema>;
\n
export const CreatePaymentDtoSchema = z.object({
  userId: z.string().optional(),
  bookingId: z.string(),
  gateway: z.string(),
  method: z.string(),
  amount: z.number(),
  currency: z.string(),
  breakdown: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreatePaymentDto = z.infer<typeof CreatePaymentDtoSchema>;
\n
export const CreateRefundDtoSchema = z.object({
  paymentId: z.string(),
  type: z.string(),
  method: z.string(),
  amount: z.number(),
  currency: z.string(),
  reason: z.string(),
  adminNotes: z.string().optional(),
  breakdown: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateRefundDto = z.infer<typeof CreateRefundDtoSchema>;
\n
export const WalletBalanceResponseDtoSchema = z.object({
  balanceType: z.string(),
  balance: z.number(),
  lockedBalance: z.number(),
  currency: z.string(),
  lastTransactionAt: z.string().datetime().optional(),
});
export type WalletBalanceResponseDto = z.infer<typeof WalletBalanceResponseDtoSchema>;
\n
export const TransactionResponseDtoSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  type: z.string(),
  source: z.string(),
  amount: z.number(),
  balanceAfter: z.number(),
  currency: z.string(),
  status: z.string(),
  description: z.string(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  createdAt: z.string().datetime(),
  processedAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});
export type TransactionResponseDto = z.infer<typeof TransactionResponseDtoSchema>;
\n
export const CreateWalletTransactionDtoSchema = z.object({
  userId: z.string().optional(),
  balanceType: z.string(),
  type: z.string(),
  source: z.string(),
  amount: z.number(),
  description: z.string(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateWalletTransactionDto = z.infer<typeof CreateWalletTransactionDtoSchema>;
\n
export const LockBalanceDtoSchema = z.object({
  balanceType: z.string(),
  amount: z.number(),
});
export type LockBalanceDto = z.infer<typeof LockBalanceDtoSchema>;
\n
export const UnlockBalanceDtoSchema = z.object({
  balanceType: z.string(),
  amount: z.number(),
});
export type UnlockBalanceDto = z.infer<typeof UnlockBalanceDtoSchema>;
\n
export const ProcessRefundDtoSchema = z.object({
  amount: z.number(),
  referenceId: z.string(),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
});
export type ProcessRefundDto = z.infer<typeof ProcessRefundDtoSchema>;
\n
export const ProcessRewardDtoSchema = z.object({
  amount: z.number(),
  source: z.string(),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
});
export type ProcessRewardDto = z.infer<typeof ProcessRewardDtoSchema>;
\n
export const CreateReviewDtoSchema = z.object({
  type: z.string(),
  reviewType: z.string().optional(),
  rating: z.number(),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
  spaceId: z.string().optional(),
  partnerId: z.string().optional(),
  bookingId: z.string().optional(),
});
export type CreateReviewDto = z.infer<typeof CreateReviewDtoSchema>;
\n
export const UpdateReviewDtoSchema = z.object({
  type: z.string().optional(),
  reviewType: z.string().optional(),
  rating: z.number().optional(),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
  spaceId: z.string().optional(),
  partnerId: z.string().optional(),
  bookingId: z.string().optional(),
  response: z.string().optional(),
});
export type UpdateReviewDto = z.infer<typeof UpdateReviewDtoSchema>;
\n
export const CreateRoleDtoSchema = z.object({

});
export type CreateRoleDto = z.infer<typeof CreateRoleDtoSchema>;
\n
export const RoleDtoSchema = z.object({

});
export type RoleDto = z.infer<typeof RoleDtoSchema>;
\n
export const UpdateRoleDtoSchema = z.object({

});
export type UpdateRoleDto = z.infer<typeof UpdateRoleDtoSchema>;
\n
export const SpaceLocationDtoSchema = z.object({
  floor: z.string().optional(),
  room: z.string().optional(),
  area: z.string().optional(),
  coordinates: z.record(z.any()).optional(),
});
export type SpaceLocationDto = z.infer<typeof SpaceLocationDtoSchema>;
\n
export const SpacePricingDtoSchema = z.object({
  basePrice: z.number(),
  currency: z.string(),
  pricePerHour: z.number().optional(),
  pricePerDay: z.number().optional(),
  pricePerWeek: z.number().optional(),
  pricePerMonth: z.number().optional(),
  minimumBookingHours: z.number().optional(),
  maximumBookingHours: z.number().optional(),
});
export type SpacePricingDto = z.infer<typeof SpacePricingDtoSchema>;
\n
export const CreateSpaceDtoSchema = z.object({
  name: z.string(),
  description: z.string(),
  spaceType: z.string(),
  bookingModel: z.string().optional(),
  capacity: z.number(),
  amenities: z.array(z.string()),
  location: SpaceLocationDtoSchema.optional(),
  pricing: SpacePricingDtoSchema,
  images: z.array(z.string()).optional(),
  availabilityRules: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});
export type CreateSpaceDto = z.infer<typeof CreateSpaceDtoSchema>;
\n
export const SpaceDtoSchema = z.object({
  id: z.record(z.any()),
  partnerId: z.record(z.any()),
  name: z.string(),
  description: z.string(),
  spaceType: z.string(),
  bookingModel: z.string(),
  capacity: z.number(),
  amenities: z.array(z.string()),
  location: SpaceLocationDtoSchema.optional(),
  pricing: SpacePricingDtoSchema,
  images: z.array(z.string()).optional(),
  status: z.string(),
  rating: z.number(),
  reviewCount: z.number(),
  totalBookings: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SpaceDto = z.infer<typeof SpaceDtoSchema>;
\n
export const OffsetPaginatedSpaceDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: OffsetPaginationDtoSchema,
});
export type OffsetPaginatedSpaceDto = z.infer<typeof OffsetPaginatedSpaceDtoSchema>;
\n
export const CursorPaginatedSpaceDtoSchema = z.object({
  data: z.array(z.any()),
  pagination: CursorPaginationDtoSchema,
});
export type CursorPaginatedSpaceDto = z.infer<typeof CursorPaginatedSpaceDtoSchema>;
\n
export const UpdateSpaceDtoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  spaceType: z.string().optional(),
  bookingModel: z.string().optional(),
  capacity: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  location: SpaceLocationDtoSchema.optional(),
  pricing: SpacePricingDtoSchema.optional(),
  images: z.array(z.string()).optional(),
  availabilityRules: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.string().optional(),
});
export type UpdateSpaceDto = z.infer<typeof UpdateSpaceDtoSchema>;
\n
export const CreateSystemConfigDtoSchema = z.object({

});
export type CreateSystemConfigDto = z.infer<typeof CreateSystemConfigDtoSchema>;
\n
export const UpdateSystemConfigDtoSchema = z.object({

});
export type UpdateSystemConfigDto = z.infer<typeof UpdateSystemConfigDtoSchema>;
\n
export const schemas = {
  OffsetPaginationDtoSchema,\n  OffsetPaginationDto: OffsetPaginationDtoSchema,\n  OffsetPaginatedDtoSchema,\n  OffsetPaginatedDto: OffsetPaginatedDtoSchema,\n  UserEntitySchema,\n  UserEntity: UserEntitySchema,\n  AdminUserUpdateDtoSchema,\n  AdminUserUpdateDto: AdminUserUpdateDtoSchema,\n  AdminUserBanDtoSchema,\n  AdminUserBanDto: AdminUserBanDtoSchema,\n  AdminUserSuspendDtoSchema,\n  AdminUserSuspendDto: AdminUserSuspendDtoSchema,\n  PlatformStatsDtoSchema,\n  PlatformStatsDto: PlatformStatsDtoSchema,\n  BookingAnalyticsDtoSchema,\n  BookingAnalyticsDto: BookingAnalyticsDtoSchema,\n  UserAnalyticsDtoSchema,\n  UserAnalyticsDto: UserAnalyticsDtoSchema,\n  RevenueAnalyticsDtoSchema,\n  RevenueAnalyticsDto: RevenueAnalyticsDtoSchema,\n  BulkKycReviewDtoSchema,\n  BulkKycReviewDto: BulkKycReviewDtoSchema,\n  BulkKycReviewResultDtoSchema,\n  BulkKycReviewResultDto: BulkKycReviewResultDtoSchema,\n  PartnerEntitySchema,\n  PartnerEntity: PartnerEntitySchema,\n  UserDtoSchema,\n  UserDto: UserDtoSchema,\n  ErrorDetailDtoSchema,\n  ErrorDetailDto: ErrorDetailDtoSchema,\n  ErrorDtoSchema,\n  ErrorDto: ErrorDtoSchema,\n  OffsetPaginatedUserDtoSchema,\n  OffsetPaginatedUserDto: OffsetPaginatedUserDtoSchema,\n  CursorPaginationDtoSchema,\n  CursorPaginationDto: CursorPaginationDtoSchema,\n  CursorPaginatedDtoSchema,\n  CursorPaginatedDto: CursorPaginatedDtoSchema,\n  CursorPaginatedUserDtoSchema,\n  CursorPaginatedUserDto: CursorPaginatedUserDtoSchema,\n  UpdateUserProfileDtoSchema,\n  UpdateUserProfileDto: UpdateUserProfileDtoSchema,\n  InitiateKycVerificationDtoSchema,\n  InitiateKycVerificationDto: InitiateKycVerificationDtoSchema,\n  KycVerificationResponseDtoSchema,\n  KycVerificationResponseDto: KycVerificationResponseDtoSchema,\n  KycStatusResponseDtoSchema,\n  KycStatusResponseDto: KycStatusResponseDtoSchema,\n  KycWebhookDtoSchema,\n  KycWebhookDto: KycWebhookDtoSchema,\n  DimensionsDtoSchema,\n  DimensionsDto: DimensionsDtoSchema,\n  BreakdownDtoSchema,\n  BreakdownDto: BreakdownDtoSchema,\n  TargetsDtoSchema,\n  TargetsDto: TargetsDtoSchema,\n  QualityDtoSchema,\n  QualityDto: QualityDtoSchema,\n  AlertsDtoSchema,\n  AlertsDto: AlertsDtoSchema,\n  CreateAnalyticsDtoSchema,\n  CreateAnalyticsDto: CreateAnalyticsDtoSchema,\n  AnalyticsDtoSchema,\n  AnalyticsDto: AnalyticsDtoSchema,\n  BulkCreateAnalyticsDtoSchema,\n  BulkCreateAnalyticsDto: BulkCreateAnalyticsDtoSchema,\n  AnalyticsStatsDtoSchema,\n  AnalyticsStatsDto: AnalyticsStatsDtoSchema,\n  MetricTrendDtoSchema,\n  MetricTrendDto: MetricTrendDtoSchema,\n  DashboardDtoSchema,\n  DashboardDto: DashboardDtoSchema,\n  UpdateAnalyticsDtoSchema,\n  UpdateAnalyticsDto: UpdateAnalyticsDtoSchema,\n  CreateAuditLogDtoSchema,\n  CreateAuditLogDto: CreateAuditLogDtoSchema,\n  AuditLogEntitySchema,\n  AuditLogEntity: AuditLogEntitySchema,\n  CreateSystemHealthDtoSchema,\n  CreateSystemHealthDto: CreateSystemHealthDtoSchema,\n  SystemHealthEntitySchema,\n  SystemHealthEntity: SystemHealthEntitySchema,\n  CheckAvailabilityDtoSchema,\n  CheckAvailabilityDto: CheckAvailabilityDtoSchema,\n  AvailabilityResponseDtoSchema,\n  AvailabilityResponseDto: AvailabilityResponseDtoSchema,\n  CreateBookingDtoSchema,\n  CreateBookingDto: CreateBookingDtoSchema,\n  BookingStatusSchema,\n  BookingStatus: BookingStatusSchema,\n  BookingDtoSchema,\n  BookingDto: BookingDtoSchema,\n  BookingEntitySchema,\n  BookingEntity: BookingEntitySchema,\n  OffsetPaginatedBookingDtoSchema,\n  OffsetPaginatedBookingDto: OffsetPaginatedBookingDtoSchema,\n  CursorPaginatedBookingDtoSchema,\n  CursorPaginatedBookingDto: CursorPaginatedBookingDtoSchema,\n  UpdateBookingDtoSchema,\n  UpdateBookingDto: UpdateBookingDtoSchema,\n  BookingKycStatusDtoSchema,\n  BookingKycStatusDto: BookingKycStatusDtoSchema,\n  CreateCouponDtoSchema,\n  CreateCouponDto: CreateCouponDtoSchema,\n  CouponEntitySchema,\n  CouponEntity: CouponEntitySchema,\n  CouponUsageDtoSchema,\n  CouponUsageDto: CouponUsageDtoSchema,\n  UpdateCouponDtoSchema,\n  UpdateCouponDto: UpdateCouponDtoSchema,\n  CreateNotificationDtoSchema,\n  CreateNotificationDto: CreateNotificationDtoSchema,\n  NotificationResponseDtoSchema,\n  NotificationResponseDto: NotificationResponseDtoSchema,\n  BulkNotificationDtoSchema,\n  BulkNotificationDto: BulkNotificationDtoSchema,\n  UpdateNotificationStatusDtoSchema,\n  UpdateNotificationStatusDto: UpdateNotificationStatusDtoSchema,\n  PeakHoursDtoSchema,\n  PeakHoursDto: PeakHoursDtoSchema,\n  DateRangeDtoSchema,\n  DateRangeDto: DateRangeDtoSchema,\n  DemandThresholdDtoSchema,\n  DemandThresholdDto: DemandThresholdDtoSchema,\n  DurationThresholdDtoSchema,\n  DurationThresholdDto: DurationThresholdDtoSchema,\n  SpecialConditionDtoSchema,\n  SpecialConditionDto: SpecialConditionDtoSchema,\n  PricingConditionsDtoSchema,\n  PricingConditionsDto: PricingConditionsDtoSchema,\n  CreatePricingRuleDtoSchema,\n  CreatePricingRuleDto: CreatePricingRuleDtoSchema,\n  PricingRuleResponseDtoSchema,\n  PricingRuleResponseDto: PricingRuleResponseDtoSchema,\n  UpdatePricingRuleDtoSchema,\n  UpdatePricingRuleDto: UpdatePricingRuleDtoSchema,\n  PricingCalculationRequestDtoSchema,\n  PricingCalculationRequestDto: PricingCalculationRequestDtoSchema,\n  AppliedRuleDtoSchema,\n  AppliedRuleDto: AppliedRuleDtoSchema,\n  PricingBreakdownDtoSchema,\n  PricingBreakdownDto: PricingBreakdownDtoSchema,\n  PricingCalculationResponseDtoSchema,\n  PricingCalculationResponseDto: PricingCalculationResponseDtoSchema,\n  CreateContentPageDtoSchema,\n  CreateContentPageDto: CreateContentPageDtoSchema,\n  UpdateContentPageDtoSchema,\n  UpdateContentPageDto: UpdateContentPageDtoSchema,\n  UpdateMediaDtoSchema,\n  UpdateMediaDto: UpdateMediaDtoSchema,\n  CreateModerationDtoSchema,\n  CreateModerationDto: CreateModerationDtoSchema,\n  ContentModerationEntitySchema,\n  ContentModerationEntity: ContentModerationEntitySchema,\n  UpdateModerationDtoSchema,\n  UpdateModerationDto: UpdateModerationDtoSchema,\n  EvidenceDtoSchema,\n  EvidenceDto: EvidenceDtoSchema,\n  CreateDisputeDtoSchema,\n  CreateDisputeDto: CreateDisputeDtoSchema,\n  DisputeDtoSchema,\n  DisputeDto: DisputeDtoSchema,\n  DisputeStatsDtoSchema,\n  DisputeStatsDto: DisputeStatsDtoSchema,\n  TimelineEventDtoSchema,\n  TimelineEventDto: TimelineEventDtoSchema,\n  UpdateDisputeDtoSchema,\n  UpdateDisputeDto: UpdateDisputeDtoSchema,\n  EscalateDisputeDtoSchema,\n  EscalateDisputeDto: EscalateDisputeDtoSchema,\n  ResolveDisputeDtoSchema,\n  ResolveDisputeDto: ResolveDisputeDtoSchema,\n  FileDtoSchema,\n  FileDto: FileDtoSchema,\n  CreatePayoutDtoSchema,\n  CreatePayoutDto: CreatePayoutDtoSchema,\n  PayoutEntitySchema,\n  PayoutEntity: PayoutEntitySchema,\n  UpdatePayoutDtoSchema,\n  UpdatePayoutDto: UpdatePayoutDtoSchema,\n  CreateFinancialReportDtoSchema,\n  CreateFinancialReportDto: CreateFinancialReportDtoSchema,\n  FinancialReportEntitySchema,\n  FinancialReportEntity: FinancialReportEntitySchema,\n  HealthCheckDtoSchema,\n  HealthCheckDto: HealthCheckDtoSchema,\n  GenerateInvoiceFromBookingDtoSchema,\n  GenerateInvoiceFromBookingDto: GenerateInvoiceFromBookingDtoSchema,\n  InvoiceResponseDtoSchema,\n  InvoiceResponseDto: InvoiceResponseDtoSchema,\n  CreateInvoiceDtoSchema,\n  CreateInvoiceDto: CreateInvoiceDtoSchema,\n  InvoiceStatsDtoSchema,\n  InvoiceStatsDto: InvoiceStatsDtoSchema,\n  UpdateInvoiceDtoSchema,\n  UpdateInvoiceDto: UpdateInvoiceDtoSchema,\n  DemographicsDtoSchema,\n  DemographicsDto: DemographicsDtoSchema,\n  ExpansionDtoSchema,\n  ExpansionDto: ExpansionDtoSchema,\n  CreateLocationDtoSchema,\n  CreateLocationDto: CreateLocationDtoSchema,\n  LocationDtoSchema,\n  LocationDto: LocationDtoSchema,\n  LocationStatsDtoSchema,\n  LocationStatsDto: LocationStatsDtoSchema,\n  UpdateLocationDtoSchema,\n  UpdateLocationDto: UpdateLocationDtoSchema,\n  CreateMessageDtoSchema,\n  CreateMessageDto: CreateMessageDtoSchema,\n  AddressDtoSchema,\n  AddressDto: AddressDtoSchema,\n  ContactInfoDtoSchema,\n  ContactInfoDto: ContactInfoDtoSchema,\n  BusinessDetailsDtoSchema,\n  BusinessDetailsDto: BusinessDetailsDtoSchema,\n  OperatingHoursDtoSchema,\n  OperatingHoursDto: OperatingHoursDtoSchema,\n  CreatePartnerDtoSchema,\n  CreatePartnerDto: CreatePartnerDtoSchema,\n  PartnerDtoSchema,\n  PartnerDto: PartnerDtoSchema,\n  UpdatePartnerDtoSchema,\n  UpdatePartnerDto: UpdatePartnerDtoSchema,\n  UpdatePartnerVerificationDtoSchema,\n  UpdatePartnerVerificationDto: UpdatePartnerVerificationDtoSchema,\n  CreatePartnerCommissionSettingsDtoSchema,\n  CreatePartnerCommissionSettingsDto: CreatePartnerCommissionSettingsDtoSchema,\n  PartnerCommissionSettingsEntitySchema,\n  PartnerCommissionSettingsEntity: PartnerCommissionSettingsEntitySchema,\n  UpdatePartnerCommissionSettingsDtoSchema,\n  UpdatePartnerCommissionSettingsDto: UpdatePartnerCommissionSettingsDtoSchema,\n  CreatePaymentDtoSchema,\n  CreatePaymentDto: CreatePaymentDtoSchema,\n  CreateRefundDtoSchema,\n  CreateRefundDto: CreateRefundDtoSchema,\n  WalletBalanceResponseDtoSchema,\n  WalletBalanceResponseDto: WalletBalanceResponseDtoSchema,\n  TransactionResponseDtoSchema,\n  TransactionResponseDto: TransactionResponseDtoSchema,\n  CreateWalletTransactionDtoSchema,\n  CreateWalletTransactionDto: CreateWalletTransactionDtoSchema,\n  LockBalanceDtoSchema,\n  LockBalanceDto: LockBalanceDtoSchema,\n  UnlockBalanceDtoSchema,\n  UnlockBalanceDto: UnlockBalanceDtoSchema,\n  ProcessRefundDtoSchema,\n  ProcessRefundDto: ProcessRefundDtoSchema,\n  ProcessRewardDtoSchema,\n  ProcessRewardDto: ProcessRewardDtoSchema,\n  CreateReviewDtoSchema,\n  CreateReviewDto: CreateReviewDtoSchema,\n  UpdateReviewDtoSchema,\n  UpdateReviewDto: UpdateReviewDtoSchema,\n  CreateRoleDtoSchema,\n  CreateRoleDto: CreateRoleDtoSchema,\n  RoleDtoSchema,\n  RoleDto: RoleDtoSchema,\n  UpdateRoleDtoSchema,\n  UpdateRoleDto: UpdateRoleDtoSchema,\n  SpaceLocationDtoSchema,\n  SpaceLocationDto: SpaceLocationDtoSchema,\n  SpacePricingDtoSchema,\n  SpacePricingDto: SpacePricingDtoSchema,\n  CreateSpaceDtoSchema,\n  CreateSpaceDto: CreateSpaceDtoSchema,\n  SpaceDtoSchema,\n  SpaceDto: SpaceDtoSchema,\n  OffsetPaginatedSpaceDtoSchema,\n  OffsetPaginatedSpaceDto: OffsetPaginatedSpaceDtoSchema,\n  CursorPaginatedSpaceDtoSchema,\n  CursorPaginatedSpaceDto: CursorPaginatedSpaceDtoSchema,\n  UpdateSpaceDtoSchema,\n  UpdateSpaceDto: UpdateSpaceDtoSchema,\n  CreateSystemConfigDtoSchema,\n  CreateSystemConfigDto: CreateSystemConfigDtoSchema,\n  UpdateSystemConfigDtoSchema,\n  UpdateSystemConfigDto: UpdateSystemConfigDtoSchema,
};

export type Schemas = typeof schemas;
