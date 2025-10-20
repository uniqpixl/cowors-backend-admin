'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: ('Admin' | 'SuperAdmin')[];
}

export default function AdminRouteGuard({ 
  children, 
  requiredRoles = ['Admin', 'SuperAdmin']
}: AdminRouteGuardProps) {
  const { user, isLoading, isAuthenticated, hasAdminAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🛡️ AdminRouteGuard: Auth state check', {
      isLoading,
      isAuthenticated,
      hasAdminAccess,
      userRole: user?.role,
      currentPath: window.location.pathname
    });
    
    // Handle authentication redirects
    if (!isLoading) {
      const currentPath = window.location.pathname;
      
      // Always allow access to signin page
      if (currentPath === '/auth/login') {
        console.log('🛡️ AdminRouteGuard: Allowing access to login page');
        return;
      }
      
      // Allow health-check page to handle its own auto-login
      if (currentPath === '/health-check') {
        console.log('🛡️ AdminRouteGuard: Allowing health-check page to handle auto-login');
        return;
      }
      
      // Redirect unauthenticated users to signin
      if (!isAuthenticated) {
        console.log('🛡️ AdminRouteGuard: User not authenticated, redirecting to login');
        router.replace('/auth/login');
        return;
      }
      
      // Redirect users without admin access to login
      if (!hasAdminAccess) {
        console.log('🛡️ AdminRouteGuard: User lacks admin access, redirecting to login');
        router.replace('/auth/login');
        return;
      }
      
      // Check role requirements
      if (requiredRoles.length > 0 && user?.role) {
        const hasRequiredRole = requiredRoles.includes(user.role as 'Admin' | 'SuperAdmin');
        if (!hasRequiredRole) {
          console.log('🛡️ AdminRouteGuard: User lacks required role, redirecting to login');
          router.replace('/auth/login');
          return;
        }
      }
      
      console.log('🛡️ AdminRouteGuard: All checks passed, allowing access');
    }
  }, [isLoading, isAuthenticated, hasAdminAccess, user?.role, requiredRoles, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Allow health-check page to render regardless of auth status
  if (typeof window !== 'undefined' && window.location.pathname === '/health-check') {
    return <>{children}</>;
  }

  // Show children if all checks pass
  if (isAuthenticated && hasAdminAccess) {
    // Check role requirements
    if (requiredRoles.length === 0 || (user?.role && requiredRoles.includes(user.role as 'Admin' | 'SuperAdmin'))) {
      return <>{children}</>;
    }
  }

  // Default loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}