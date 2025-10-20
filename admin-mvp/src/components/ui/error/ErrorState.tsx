'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../button/Button';

interface ErrorStateProps {
  message?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Something went wrong', 
  error,
  onRetry,
  className = '',
  showRetry = true
}) => {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="flex flex-col items-center space-y-4 text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {message}
          </h3>
          {error && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error}
            </p>
          )}
        </div>

        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;