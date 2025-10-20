'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import Badge from '@/components/ui/badge/Badge'
import { Modal } from '@/components/ui'
import { Download, Database, Calendar, Trash2, Settings, AlertTriangle, Loader2 } from 'lucide-react'
import { useDataManagement } from '../../hooks/useDataManagement'

interface DataExport {
  id: string
  type: string
  status: 'completed' | 'processing' | 'failed'
  createdAt: string
  size: string
  downloadUrl?: string
}

interface BackupSchedule {
  id: string
  name: string
  frequency: string
  lastRun: string
  nextRun: string
  status: 'active' | 'paused' | 'failed'
}

export default function DataManagementContent() {
  const {
    recentExports,
    backupSchedules,
    retentionSettings,
    isLoadingExports,
    isLoadingBackups,
    isLoadingRetention,
    createExport,
    updateRetentionSettings,
    isCreatingExport,
    isUpdatingRetention,
  } = useDataManagement();

  const [showExportModal, setShowExportModal] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [exportType, setExportType] = useState('');
  const [exportFormat, setExportFormat] = useState('');
  const [retentionDays, setRetentionDays] = useState(365);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  // const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false)
  const [selectedExportType, setSelectedExportType] = useState('users')
  const [retentionPeriod, setRetentionPeriod] = useState('90')
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true)

  const exportTypes = [
    { value: 'users', label: 'Users Data' },
    { value: 'bookings', label: 'Bookings Data' },
    { value: 'spaces', label: 'Spaces Data' },
    { value: 'financial', label: 'Financial Data' },
    { value: 'reviews', label: 'Reviews Data' },
    { value: 'all', label: 'Complete Export' }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'success',
      processing: 'warning',
      failed: 'error',
      active: 'success',
      paused: 'light'
    }
    return colors[status as keyof typeof colors] || 'light'
  }

  const handleExport = async () => {
    if (!selectedExportType) {
      return;
    }

    try {
      await createExport.mutateAsync({
        type: selectedExportType,
        format: 'csv', // Default format
      });
      setIsExportModalOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleSaveRetention = async () => {
    try {
      await updateRetentionSettings.mutateAsync({
        userDataRetention: parseInt(retentionPeriod),
        bookingDataRetention: parseInt(retentionPeriod),
        auditLogRetention: parseInt(retentionPeriod),
        financialDataRetention: parseInt(retentionPeriod),
        autoDeleteEnabled,
      });
      setIsRetentionModalOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="space-y-8">
      {/* Data Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Export</h3>
            <p className="text-sm text-gray-600 mt-1">Export platform data for analysis or backup purposes</p>
          </div>
          <Button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            New Export
          </Button>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Recent Exports</h4>
          <div className="space-y-3">
            {isLoadingExports ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading exports...</span>
              </div>
            ) : recentExports && recentExports.length > 0 ? (
              recentExports.map((exportItem) => (
                <div key={exportItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Database className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{exportItem.type}</p>
                      <p className="text-sm text-gray-600">{exportItem.createdAt} • {exportItem.size || 'Processing...'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge color={getStatusColor(exportItem.status) as 'success' | 'warning' | 'error' | 'light'}>
                      {exportItem.status}
                    </Badge>
                    {exportItem.downloadUrl && exportItem.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No exports found</p>
            )}
          </div>
        </div>
      </div>

      {/* Backup Management Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Backup Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage automated backup schedules and restore points</p>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Backup
          </Button>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Backup Schedules</h4>
          <div className="space-y-3">
            {isLoadingBackups ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading backup schedules...</span>
              </div>
            ) : backupSchedules && backupSchedules.length > 0 ? (
              backupSchedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{schedule.name}</p>
                      <p className="text-sm text-gray-600">{schedule.frequency}</p>
                      <p className="text-xs text-gray-500">Last: {schedule.lastRun} • Next: {schedule.nextRun}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge color={getStatusColor(schedule.status) as 'success' | 'warning' | 'error' | 'light'}>
                      {schedule.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No backup schedules found</p>
            )}
          </div>
        </div>
      </div>

      {/* Data Retention Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Retention</h3>
            <p className="text-sm text-gray-600 mt-1">Configure data retention policies and automatic cleanup</p>
          </div>
          <Button
            onClick={() => setIsRetentionModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Manage Retention
          </Button>
        </div>

        {isLoadingRetention ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading retention settings...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h4 className="font-medium text-gray-900">Current Policy</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">{retentionSettings?.userDataRetention || retentionPeriod} days</p>
              <p className="text-sm text-gray-600">Data retention period</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Auto-Delete</h4>
              <p className="text-2xl font-bold text-gray-900">{retentionSettings?.autoDeleteEnabled !== undefined ? (retentionSettings.autoDeleteEnabled ? 'Enabled' : 'Disabled') : (autoDeleteEnabled ? 'Enabled' : 'Disabled')}</p>
              <p className="text-sm text-gray-600">Automatic cleanup</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Last Cleanup</h4>
              <p className="text-2xl font-bold text-gray-900">{retentionSettings?.lastCleanup || 'Never'}</p>
              <p className="text-sm text-gray-600">Last cleanup date</p>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exportType">Export Type</Label>
              {/* Simple select dropdown for now */}
              <select
                id="exportType"
                value={selectedExportType}
                onChange={(e) => setSelectedExportType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
              >
                {exportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Export Notice</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Large exports may take several minutes to process. You will receive an email when ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isCreatingExport || !selectedExportType}
            >
              {isCreatingExport ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Export...
                </>
              ) : (
                'Start Export'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Retention Modal */}
      <Modal isOpen={isRetentionModalOpen} onClose={() => setIsRetentionModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
              <Input
                id="retentionPeriod"
                type="number"
                defaultValue={retentionPeriod}
                onChange={(e) => setRetentionPeriod(e.target.value)}
                placeholder="Enter retention period"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoDelete"
                checked={autoDeleteEnabled}
                onChange={(e) => setAutoDeleteEnabled(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="autoDelete">Enable automatic deletion of old data</Label>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Warning</p>
                  <p className="text-sm text-red-700 mt-1">
                    Deleted data cannot be recovered. Ensure you have proper backups before enabling auto-deletion.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setIsRetentionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
               onClick={handleSaveRetention} 
               className="bg-red-600 hover:bg-red-700 text-white"
               disabled={isUpdatingRetention}
             >
               {isUpdatingRetention ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Saving...
                 </>
               ) : (
                 'Save Settings'
               )}
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}