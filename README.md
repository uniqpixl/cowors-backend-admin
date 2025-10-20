# Cowors MVP - Backend & Admin Application

A comprehensive workspace management platform consisting of a robust backend API server and an intuitive admin dashboard for managing spaces, users, bookings, and platform operations.

## 🏗️ Architecture Overview

This repository contains two main components:

### 🔧 Backend Server (`/backend-server`)
A NestJS-based REST API server that provides:
- **Authentication & Authorization** - JWT-based auth with role-based access control
- **User Management** - User registration, profiles, and role management
- **Space Management** - Workspace listings, availability, and booking management
- **Partner Management** - Partner onboarding, verification, and space management
- **Booking System** - Real-time booking, payments, and scheduling
- **Admin Dashboard APIs** - Comprehensive admin endpoints for platform management
- **Analytics & Reporting** - Platform statistics and performance metrics

### 🎛️ Admin Application (`/admin-mvp`)
A Next.js-based admin dashboard featuring:
- **Dashboard Overview** - KPI metrics, revenue tracking, and platform statistics
- **User Management** - User administration, role assignment, and account management
- **Space Management** - Space approval, categorization, and monitoring
- **Booking Management** - Booking oversight, conflict resolution, and scheduling
- **Partner Management** - Partner verification, onboarding, and relationship management
- **Analytics & Reports** - Comprehensive reporting and data visualization
- **Settings & Configuration** - Platform settings, commission management, and system configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- PostgreSQL database
- Redis (for caching and sessions)

### Backend Server Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Configure your database, Redis, JWT secrets, and other environment variables
   ```

4. **Database Setup:**
   ```bash
   # Run database migrations
   npm run migration:run
   
   # Seed initial data (optional)
   npm run seed
   ```

5. **Start the server:**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run start:prod
   ```

The backend server will be available at `http://localhost:5001`

### Admin Application Setup

1. **Navigate to admin directory:**
   ```bash
   cd admin-mvp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.local.example .env.local
   # Configure API endpoints and authentication settings
   ```

4. **Start the application:**
   ```bash
   # Development mode
   npm run dev
   
   # Build for production
   npm run build
   npm run start
   ```

The admin application will be available at `http://localhost:3001`

## 🔧 Technology Stack

### Backend Server
- **Framework:** NestJS (Node.js)
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport.js
- **Caching:** Redis
- **Validation:** Class Validator
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest

### Admin Application
- **Framework:** Next.js 14 (React)
- **Styling:** Tailwind CSS
- **UI Components:** Custom component library
- **State Management:** React Context + Hooks
- **Authentication:** NextAuth.js
- **Charts:** Recharts
- **Forms:** React Hook Form
- **TypeScript:** Full type safety

## 📁 Project Structure

```
cowors-mvp/
├── backend-server/           # NestJS Backend API
│   ├── src/
│   │   ├── api/             # API controllers and routes
│   │   ├── auth/            # Authentication modules
│   │   ├── database/        # Database configuration and entities
│   │   ├── modules/         # Feature modules (users, spaces, bookings)
│   │   ├── services/        # Business logic services
│   │   └── utils/           # Utility functions
│   ├── migrations/          # Database migrations
│   └── test/               # Test suites
│
└── admin-mvp/              # Next.js Admin Dashboard
    ├── src/
    │   ├── app/            # Next.js app router pages
    │   ├── components/     # Reusable UI components
    │   ├── lib/           # API clients and utilities
    │   ├── services/      # Data fetching services
    │   └── types/         # TypeScript type definitions
    └── public/            # Static assets
```

## 🔐 Authentication & Security

### Backend Security Features
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Partner, User)
- Password hashing with bcrypt
- Rate limiting and request throttling
- CORS configuration
- Input validation and sanitization

### Admin Dashboard Security
- Protected routes with authentication middleware
- Role-based component rendering
- Secure API communication
- Session management
- CSRF protection

## �� Key Features

### Dashboard Analytics
- Real-time KPI tracking
- Revenue and booking analytics
- User growth metrics
- Platform performance monitoring

### User Management
- User registration and profile management
- Role assignment and permissions
- Account verification and moderation
- Activity tracking and audit logs

### Space Management
- Space listing and approval workflow
- Category and amenity management
- Availability and pricing controls
- Quality assurance and monitoring

### Booking System
- Real-time booking management
- Conflict resolution tools
- Payment processing integration
- Automated notifications and reminders

## 🛠️ Development

### Running Tests
```bash
# Backend tests
cd backend-server
npm run test
npm run test:e2e

# Admin application tests
cd admin-mvp
npm run test
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

## 📝 API Documentation

The backend API documentation is available via Swagger UI when running in development mode:
- **Swagger UI:** `http://localhost:5001/api/docs`
- **OpenAPI JSON:** `http://localhost:5001/api/docs-json`

## 🚀 Deployment

### Backend Deployment
- Supports Docker containerization
- Environment-specific configurations
- Database migration automation
- Health check endpoints

### Admin Dashboard Deployment
- Static site generation support
- Vercel/Netlify ready
- Environment variable configuration
- Build optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the documentation in each component's README
- Review the API documentation for backend integration

---

**Built with ❤️ for modern workspace management**

## 📦 Packages

The repository includes essential packages that provide shared functionality across the applications:

### Core Packages

#### @cowors/admin-sdk
- **Purpose**: Admin SDK with type-safe API client and authentication
- **Used by**: admin-mvp
- **Features**: 
  - Base API client with error handling and retry logic
  - Admin-specific services (dashboard, users, partners, bookings, analytics)
  - Authentication integration with role validation
  - TypeScript support with comprehensive interfaces

#### @cowors/shared-types
- **Purpose**: Shared TypeScript types and enums for all Cowors applications
- **Used by**: admin-mvp, backend-server, and all SDKs
- **Features**:
  - User types and enums (UserRole, UserStatus)
  - Booking types and enums
  - Payment types and enums
  - Space types and enums
  - API response types

#### @cowors/shared-auth
- **Purpose**: Shared authentication utilities and configurations
- **Used by**: admin-mvp
- **Features**:
  - Better Auth integration
  - Cross-application authentication flows
  - Error handling utilities
  - Authentication middleware

#### @cowors/api-codegen
- **Purpose**: OpenAPI to Zod schema generator for type-safe API clients
- **Features**:
  - Generates TypeScript types from OpenAPI specs
  - Creates Zod schemas for runtime validation
  - Supports filtering by API endpoints (admin, user, partner)
  - CLI tool for automated code generation

### Package Dependencies

```
admin-mvp
├── @cowors/admin-sdk
├── @cowors/shared-types
└── @cowors/shared-auth

backend-server
└── @cowors/shared-types

@cowors/admin-sdk
└── @cowors/shared-types

@cowors/shared-auth
└── @cowors/shared-types
```

### Development Workflow

1. **Install Dependencies**: Each package has its own `package.json` with specific dependencies
2. **Build Packages**: Run `npm run build` in each package directory to compile TypeScript
3. **Link Packages**: Use workspace linking for local development
4. **Generate API Clients**: Use `@cowors/api-codegen` to generate type-safe API clients from OpenAPI specs

