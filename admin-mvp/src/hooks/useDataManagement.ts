import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  dataManagementService,
  type ExportData,
  type BackupSchedule,
  type RetentionSettings,
  type CreateExportRequest,
  type UpdateRetentionRequest,
} from '../lib/api/dataManagementService';

// Query keys
const QUERY_KEYS = {
  exports: ['data-management', 'exports'] as const,
  backups: ['data-management', 'backups'] as const,
  retention: ['data-management', 'retention'] as const,
};

// Hook for recent exports
export function useRecentExports() {
  return useQuery({
    queryKey: QUERY_KEYS.exports,
    queryFn: () => dataManagementService.getRecentExports(),
    select: (data) => data.recentExports,
  });
}

// Hook for backup schedules
export function useBackupSchedules() {
  return useQuery({
    queryKey: QUERY_KEYS.backups,
    queryFn: () => dataManagementService.getBackupSchedules(),
    select: (data) => data.backupSchedules,
  });
}

// Hook for retention settings
export function useRetentionSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.retention,
    queryFn: () => dataManagementService.getRetentionSettings(),
    select: (data) => data.retentionSettings,
  });
}

// Hook for creating exports
export function useCreateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExportRequest) => dataManagementService.createExport(data),
    onSuccess: (data) => {
      // Invalidate and refetch exports
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exports });
      toast.success(`Export "${data.type}" created successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create export');
    },
  });
}

// Hook for updating retention settings
export function useUpdateRetentionSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRetentionRequest) => dataManagementService.updateRetentionSettings(data),
    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(QUERY_KEYS.retention, {
        retentionSettings: data.retentionSettings,
      });
      toast.success(data.message || 'Retention settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update retention settings');
    },
  });
}

// Combined hook for all data management operations
export function useDataManagement() {
  const recentExports = useRecentExports();
  const backupSchedules = useBackupSchedules();
  const retentionSettings = useRetentionSettings();
  const createExport = useCreateExport();
  const updateRetentionSettings = useUpdateRetentionSettings();

  return {
    // Data
    recentExports: recentExports.data || [],
    backupSchedules: backupSchedules.data || [],
    retentionSettings: retentionSettings.data,
    
    // Loading states
    isLoadingExports: recentExports.isLoading,
    isLoadingBackups: backupSchedules.isLoading,
    isLoadingRetention: retentionSettings.isLoading,
    
    // Error states
    exportsError: recentExports.error,
    backupsError: backupSchedules.error,
    retentionError: retentionSettings.error,
    
    // Mutations
    createExport,
    updateRetentionSettings,
    
    // Mutation states
    isCreatingExport: createExport.isPending,
    isUpdatingRetention: updateRetentionSettings.isPending,
  };
}