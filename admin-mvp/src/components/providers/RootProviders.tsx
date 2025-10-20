'use client';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'sonner';
import React from 'react';

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            {children}
            <Toaster position="top-right" />
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}