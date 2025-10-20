import { apiClient } from './client';

export interface ExportData {
  id: string;
  type: string;
  format: string;
  status: 'processing' | 'completed' | 'failed';
  size: string | null;
  createdAt: string;
  downloadUrl: string | null;
}

export interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  status: 'active' | 'inactive';
  lastRun: string | null;
  nextRun: string | null;
  retentionDays: number;
}

export interface RetentionSettings {
  userDataRetention: number;
  bookingDataRetention: number;
  auditLogRetention: number;
  financialDataRetention: number;
  autoDeleteEnabled: boolean;
  lastCleanup: string | null;
}

export interface CreateExportRequest {
  type: string;
  format: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface UpdateRetentionRequest {
  userDataRetention?: number;
  bookingDataRetention?: number;
  auditLogRetention?: number;
  financialDataRetention?: number;
  autoDeleteEnabled?: boolean;
}

export const dataManagementService = {
  // Export operations
  async getRecentExports(): Promise<{ recentExports: ExportData[] }> {
    const response = await apiClient.get('/api/v1/admin/data-management/exports');
    return response.data;
  },

  async createExport(data: CreateExportRequest): Promise<ExportData> {
    const response = await apiClient.post('/api/v1/admin/data-management/exports', data);
    return response.data;
  },

  // Backup operations
  async getBackupSchedules(): Promise<{ backupSchedules: BackupSchedule[] }> {
    const response = await apiClient.get('/api/v1/admin/data-management/backups');
    return response.data;
  },

  // Retention operations
  async getRetentionSettings(): Promise<{ retentionSettings: RetentionSettings }> {
    const response = await apiClient.get('/api/v1/admin/data-management/retention');
    return response.data;
  },

  async updateRetentionSettings(data: UpdateRetentionRequest): Promise<{
    success: boolean;
    message: string;
    retentionSettings: RetentionSettings & { lastUpdated: string };
  }> {
    const response = await apiClient.put('/api/v1/admin/data-management/retention', data);
    return response.data;
  },
};