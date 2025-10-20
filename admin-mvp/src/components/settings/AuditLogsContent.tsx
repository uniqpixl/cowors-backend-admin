"use client";
import React, { useState, useMemo } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { Download, Filter, Eye, Calendar as CalendarIcon, FileText, Shield, AlertTriangle, User, DollarSign, Settings, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuditLogs, useAuditLogsStats, useExportAuditLogs } from "@/hooks/useAuditLogs";
import { AuditLog, AuditLogsFilters } from "@/lib/api/types";
import { formatCoworsId, isValidCoworsId, getIdType } from "@/utils/formatters";





const actionCategories = [
  { value: "all", label: "All Categories", icon: FileText },
  { value: "user_management", label: "User Management", icon: User },
  { value: "finance", label: "Finance", icon: DollarSign },
  { value: "system", label: "System", icon: Settings },
  { value: "security", label: "Security", icon: Shield },
  { value: "content", label: "Content", icon: FileText }
];

const severityColors: Record<string, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
  low: "light",
  medium: "info",
  high: "warning",
  critical: "error"
};

const categoryColors: Record<string, "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"> = {
  user_management: "primary",
  finance: "success",
  system: "info",
  security: "error",
  content: "warning"
};

export default function AuditLogsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Build filters object
  const filters: AuditLogsFilters = useMemo(() => {
    const filterObj: AuditLogsFilters = {
      page: currentPage,
      limit: pageSize,
    };
    
    if (searchTerm) filterObj.search = searchTerm;
    if (categoryFilter) filterObj.category = categoryFilter;
    if (severityFilter) filterObj.severity = severityFilter;
    if (dateRange.from || dateRange.to) {
      filterObj.dateRange = {
        start: dateRange.from || undefined,
        end: dateRange.to || undefined,
      };
    }
    
    return filterObj;
  }, [searchTerm, categoryFilter, severityFilter, dateRange, currentPage, pageSize]);

  // API hooks
  const { data: auditLogsData, isLoading: logsLoading, error: logsError } = useAuditLogs(filters);
  const { data: statsData, isLoading: statsLoading, error: statsError } = useAuditLogsStats();
  const exportMutation = useExportAuditLogs();

  // Get data from API
  const logs = auditLogsData?.logs || [];
  const totalLogs = auditLogsData?.total || 0;
  const totalPages = auditLogsData?.totalPages || 1;
  
  // Stats from API
  const stats = {
    total: statsData?.total || 0,
    critical: statsData?.critical || 0,
    finance: statsData?.finance || 0,
    security: statsData?.security || 0,
  };

  // Since filtering is now handled by the API, we use logs directly
  const filteredLogs = logs;

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setSeverityFilter('');
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
  };

  // const formatValues = (values: Record<string, unknown> | undefined) => {
  //   if (!values || Object.keys(values).length === 0) return "—";
  //   return Object.entries(values)
  //     .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  //     .join(", ");
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Immutable log of all administrative actions</p>
        </div>
        <Button 
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.total.toLocaleString()
                  )}
                </p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Actions</p>
                <p className="text-2xl font-bold text-red-600">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.critical.toLocaleString()
                  )}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Finance Actions</p>
                <p className="text-2xl font-bold text-green-600">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.finance.toLocaleString()
                  )}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Events</p>
                <p className="text-2xl font-bold text-orange-600">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats.security.toLocaleString()
                  )}
                </p>
              </div>
              <Shield className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Logs</label>
              <input
                id="search"
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              {/* Simple select dropdown for now */}
              <select
                value={categoryFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
              >
                <option value="">All Categories</option>
                {actionCategories.filter(cat => cat.value !== 'all').map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              {/* Simple select dropdown for now */}
              <select
                value={severityFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="relative">
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
                <div className="hidden absolute top-full left-0 mt-1 w-auto p-0 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  {/* Calendar component placeholder - functionality disabled */}
                  <div className="p-4 text-center text-gray-500">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2" />
                    <p>Date picker temporarily unavailable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {(searchTerm || categoryFilter || severityFilter || dateRange.from) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Showing {filteredLogs.length} of {totalLogs} logs</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audit Trail ({filteredLogs.length} entries)
            </h3>
            <Button onClick={handleExport} variant="outline" disabled={exportMutation.isPending}>
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
          <p className="text-gray-600 mt-1">
            All administrative actions are logged and cannot be modified
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Admin User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Target</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Severity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No audit logs found matching the current filters
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{log.adminUser}</div>
                          <div className="text-sm text-gray-500">{log.adminRole}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">{log.action}</td>
                      <td className="py-3 px-4">
                        <Badge color={categoryColors[log.category] || "light"}>
                          {log.category.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{log.targetType}</div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 font-mono">{formatCoworsId(log.targetId)}</span>
                            {getIdType(log.targetId) === 'uuid' && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={severityColors[log.severity] || "light"}>
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">{log.description}</td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
          
          {/* Pagination */}
          {!logsLoading && filteredLogs.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for log details */}
      {selectedLog && (
        <Modal 
          isOpen={!!selectedLog} 
          onClose={() => setSelectedLog(null)}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                <span className="sr-only">Close</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </Button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                  <p className="font-mono text-sm">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Log ID</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{formatCoworsId(selectedLog.id)}</p>
                    {getIdType(selectedLog.id) === 'uuid' && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin User</label>
                  <p>{selectedLog.adminUser}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p>{selectedLog.adminRole}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <p className="font-mono">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Badge color={categoryColors[selectedLog.category] || "light"}>
                    {selectedLog.category.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
                  <p>{selectedLog.targetType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target ID</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono">{formatCoworsId(selectedLog.targetId)}</p>
                    {getIdType(selectedLog.targetId) === 'uuid' && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <Badge color={severityColors[selectedLog.severity] || "light"}>
                    {selectedLog.severity}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                  <p className="font-mono">{selectedLog.ipAddress}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="mt-1">{selectedLog.description}</p>
              </div>
              
              {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Values</label>
                  <pre className="mt-1 p-3 bg-gray-100 rounded text-sm font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Values</label>
                  <pre className="mt-1 p-3 bg-gray-100 rounded text-sm font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                <p className="mt-1 text-sm font-mono break-all">{selectedLog.userAgent}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}