export enum CacheKey {
  AccessToken = 'auth:token:%s:access', // %s: hash
  RefreshToken = 'auth:token:%s:refresh', // %s: token
  EmailVerificationToken = 'auth:token:%s:email-verification', // %s: userId
  UserSocketClients = 'socket:%s:clients', // %s: userId
  SignInMagicLinkMailLastSentAt = 'auth:signin-magic-link-mail:%s:last-sent-at', // %s: userId
  EmailVerificationMailLastSentAt = 'auth:email-verification-mail:%s:last-sent-at', // %s: userId
  ResetPasswordMailLastSentAt = 'auth:reset-password-mail:%s:last-sent-at', // %s: userId
  DashboardKPIs = 'admin:dashboard:kpis', // Dashboard KPIs cache
  BookingTrends = 'admin:analytics:booking-trends:%s', // %s: query hash
  RevenueTrends = 'admin:analytics:revenue-trends:%s', // %s: query hash
  UserGrowth = 'admin:analytics:user-growth:%s', // %s: query hash
  SpaceUtilization = 'admin:analytics:space-utilization:%s', // %s: query hash
}
