# @cowors/shared-types

Shared TypeScript types and enums for Cowors applications. This package provides a single source of truth for all types, interfaces, and enums used across the Cowors ecosystem.

## Installation

```bash
npm install @cowors/shared-types
```

## Usage

### Import everything
```typescript
import { UserRole, BookingStatus, User, CreateBookingDto } from '@cowors/shared-types';
```

### Import specific modules
```typescript
import { UserRole, UserStatus, User } from '@cowors/shared-types/user';
import { BookingStatus, Booking } from '@cowors/shared-types/booking';
import { PaymentStatus, Payment } from '@cowors/shared-types/payment';
import { SpaceType, Space } from '@cowors/shared-types/space';
import { ApiResponse, PaginatedResponse } from '@cowors/shared-types/api';
```

## Modules

### User Types (`@cowors/shared-types/user`)
- **Enums**: `UserRole`, `UserStatus`, `KycStatus`, `UserActivityStatus`
- **Types**: `User`, `AdminUser`, `PartnerUser`, `CreateUserDto`, `UpdateUserDto`, etc.

### Booking Types (`@cowors/shared-types/booking`)
- **Enums**: `BookingStatus`, `BookingKycStatus`, `AddonCategory`, `CancellationReason`
- **Types**: `Booking`, `CreateBookingDto`, `UpdateBookingDto`, `BookingAnalytics`, etc.

### Payment Types (`@cowors/shared-types/payment`)
- **Enums**: `PaymentStatus`, `PaymentGateway`, `PaymentMethod`, `RefundStatus`, etc.
- **Types**: `Payment`, `Refund`, `Payout`, `Wallet`, `PaymentAnalytics`, etc.

### Space Types (`@cowors/shared-types/space`)
- **Enums**: `SpaceType`, `SpaceStatus`, `AvailabilityStatus`, `SpaceAmenity`, etc.
- **Types**: `Space`, `CreateSpaceDto`, `SpaceReview`, `SpaceAnalytics`, etc.

### API Types (`@cowors/shared-types/api`)
- **Enums**: `AnalyticsTimeRange`, `ApiErrorCode`
- **Types**: `ApiResponse`, `ApiError`, `PaginatedResponse`, `DashboardKPIs`, etc.

### Notification Types (`@cowors/shared-types/notification`)
- **Enums**: `NotificationType`, `NotificationStatus`, `NotificationChannel`, etc.

## Key Features

### Type Safety
All enums and types are strictly typed with TypeScript, ensuring type safety across applications.

### Tree Shaking
The package is built with tree shaking support, so you only bundle what you use.

### Modular Exports
Import only the modules you need to reduce bundle size.

### Type Guards
Runtime type checking utilities are included for enum validation:

```typescript
import { isValidUserRole, isValidBookingStatus } from '@cowors/shared-types';

if (isValidUserRole(someValue)) {
  // someValue is guaranteed to be UserRole
}
```

## Standard Patterns

### API Responses
```typescript
import { ApiResponse, PaginatedResponse } from '@cowors/shared-types';

// Single item response
const userResponse: ApiResponse<User> = {
  success: true,
  data: user,
  message: 'User retrieved successfully'
};

// Paginated response
const usersResponse: PaginatedResponse<User> = {
  data: users,
  meta: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNextPage: true,
    hasPreviousPage: false
  }
};
```

### Error Handling
```typescript
import { ApiError, ApiErrorCode } from '@cowors/shared-types';

const errorResponse: ApiError = {
  success: false,
  message: 'Validation failed',
  statusCode: 400,
  errors: ['Email is required', 'Password must be at least 8 characters'],
  timestamp: new Date().toISOString(),
  requestId: 'req-123'
};
```

## Development

### Building
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Watch Mode
```bash
npm run build:watch
```

## Migration Guide

When upgrading from previous versions, check the [CHANGELOG.md](./CHANGELOG.md) for breaking changes and migration instructions.

## Contributing

When adding new types or enums:

1. Place them in the appropriate module directory
2. Export them from the module's `index.ts`
3. Add type guards for enums when appropriate
4. Update the main `index.ts` exports
5. Update this README with the new types
6. Add tests for type guards

## License

MIT