/**
 * @cowors/shared-auth/client
 * 
 * Client-side components and utilities for Cowors applications
 * These components require 'use client' directive and should only be imported
 * in client-side contexts
 */

// Export client-side components
export * from './components';

// Re-export client-safe utilities
export { useErrorBoundary } from './components/ErrorBoundary';