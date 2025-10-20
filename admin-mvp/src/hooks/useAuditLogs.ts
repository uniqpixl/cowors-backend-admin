import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuditLogs, getAuditLogsStats, exportAuditLogs } from '@/lib/api/adminApi';
import { AuditLogsFilters } from '@/lib/api/types';
import { toast } from 'sonner';

// Audit logs hooks
export const useAuditLogs = (filters?: AuditLogsFilters) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useAuditLogsStats = () => {
  return useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: getAuditLogsStats,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useExportAuditLogs = () => {
  return useMutation({
    mutationFn: (filters?: AuditLogsFilters) => exportAuditLogs(filters),
    onSuccess: (data) => {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Audit logs exported successfully');
    },
    onError: (error) => {
      console.error('Export failed:', error);
      toast.error('Failed to export audit logs');
    },
  });
};