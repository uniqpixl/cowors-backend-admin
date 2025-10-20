import Link from 'next/link';
import Button from '@/components/ui/button/Button';
import { AlertCircle, Home, LogOut } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-lg">
          {/* Card Header */}
          <div className="px-6 py-5 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white/90">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have permission to access this admin area.
            </p>
          </div>
          
          {/* Card Body */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This area is restricted to administrators only. If you believe you should have access, 
                please contact your system administrator.
              </p>
              
              <div className="flex flex-col space-y-3">
                <Link href="/">
                  <Button variant="primary" size="md" className="w-full">
                    <Home className="h-4 w-4" />
                    Return to Dashboard
                  </Button>
                </Link>
                
                <Link href="/auth/login">
                  <Button variant="outline" size="md" className="w-full">
                    <LogOut className="h-4 w-4" />
                    Sign In with Different Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}