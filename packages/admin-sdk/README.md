# @cowors/admin-sdk

Admin SDK for Cowors applications with type-safe API client and authentication.

## Status

✅ **Foundation Complete** - The Admin SDK foundation has been extracted and structured as per the priority requirements.

### What's Ready

1. **Package Structure**: Complete package.json with proper dependencies and build configuration
2. **Base API Client**: Extracted from admin-mvp with enhanced error handling, authentication, and retry logic
3. **TypeScript Configuration**: Proper tsconfig.json for type checking and compilation
4. **Service Architecture**: Service layer for admin operations (dashboard, users, partners, bookings, analytics)
5. **Authentication Integration**: Placeholder for Better Auth integration with admin role validation

### Current Implementation

```typescript
// Base API Client with admin session validation
import { BaseApiClient, AdminDashboardService } from '@cowors/admin-sdk';

const client = new BaseApiClient({
  baseURL: 'http://localhost:5001',
  enableLogging: true,
  onError: (error) => console.error('API Error:', error),
  onUnauthorized: () => {/* handle redirect to login */}
});

const dashboardService = new AdminDashboardService(client);
const kpis = await dashboardService.getKPIs();
```

### Key Features Extracted

- **Authentication**: Admin session validation with role-based access control
- **Error Handling**: Standardized error responses and interceptors  
- **Type Safety**: Full TypeScript support with proper interfaces
- **Retry Logic**: Built-in retry mechanism for failed requests
- **Logging**: Optional request/response logging for debugging

## Installation Dependencies

```bash
npm install axios  # Required for HTTP client functionality
```

## Next Steps

1. **Install Dependencies**: Run `npm install` to install axios and resolve TypeScript compilation errors
2. **Better Auth Integration**: Replace placeholder auth functions with actual Better Auth imports
3. **Shared Types Integration**: Connect with @cowors/shared-types once workspace is properly configured
4. **Service Implementation**: Complete the service methods for full admin functionality
5. **Testing**: Add unit tests for API client and services

## Integration with admin-mvp

Once dependencies are resolved, the admin-mvp can consume this SDK:

```typescript
// Replace existing API client in admin-mvp
import { BaseApiClient, AdminDashboardService, AdminUserService } from '@cowors/admin-sdk';

// Initialize SDK
const adminSDK = new BaseApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  onUnauthorized: () => router.push('/login')
});

// Use services
const dashboardService = new AdminDashboardService(adminSDK);
const userService = new AdminUserService(adminSDK);
```

This SDK provides the foundation for **"every app talks to backend via a single, versioned SDK contract"** as specified in the requirements.