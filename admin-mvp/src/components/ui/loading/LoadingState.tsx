'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className={`animate-spin text-red-600 ${sizeClasses[size]}`} />
        {message && (
          <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingState;