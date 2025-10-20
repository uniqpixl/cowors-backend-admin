'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Settings, 
  Filter,
  Download,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoles, useAssignPermissions, useRemovePermissions } from '@/hooks/useRoles';
import { usePermissionGroups } from '@/hooks/usePermissions';
import { Role, Permission, RolePermissionMatrix } from '@/types/roles';

interface PermissionMatrixProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PermissionMatrix({ isOpen, onClose }: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedRoleType, setSelectedRoleType] = useState<string>('all');

  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissionGroups, isLoading: permissionsLoading } = usePermissionGroups();
  const assignPermissionsMutation = useAssignPermissions();
  const removePermissionsMutation = useRemovePermissions();

  const isLoading = rolesLoading || permissionsLoading;

  // Create permission matrix
  const matrix: RolePermissionMatrix = useMemo(() => {
    if (!roles) return {};
    
    const result: RolePermissionMatrix = {};
    roles.forEach(role => {
      result[role.id] = {};
      role.permissions.forEach(permission => {
        result[role.id][permission.id] = true;
      });
    });
    return result;
  }, [roles]);

  // Filter data
  const filteredRoles = roles?.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedRoleType === 'all' || 
                       (selectedRoleType === 'system' && role.isSystemRole) ||
                       (selectedRoleType === 'custom' && !role.isSystemRole);
    return matchesSearch && matchesType;
  }) || [];

  const filteredPermissionGroups = permissionGroups?.filter(group => {
    const matchesResource = selectedResource === 'all' || group.resource === selectedResource;
    const matchesSearch = searchTerm === '' || 
                         group.permissions.some(p => 
                           p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.action.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesResource && matchesSearch;
  }).map(group => ({
    ...group,
    permissions: group.permissions.filter(p =>
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.action.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })) || [];

  const allResources = permissionGroups?.map(g => g.resource) || [];

  const handlePermissionToggle = async (role: Role, permission: Permission, hasPermission: boolean) => {
    if (role.isSystemRole) return; // Prevent modification of system roles

    try {
      if (hasPermission) {
        // Remove permission
        await removePermissionsMutation.mutateAsync({
          roleId: role.id,
          data: { permissionIds: [permission.id] }
        });
      } else {
        // Add permission
        await assignPermissionsMutation.mutateAsync({
          roleId: role.id,
          data: { permissionIds: [permission.id] }
        });
      }
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleBulkToggle = async (role: Role, permissions: Permission[], shouldAssign: boolean) => {
    if (role.isSystemRole) return;

    const permissionIds = permissions.map(p => p.id);
    
    try {
      if (shouldAssign) {
        await assignPermissionsMutation.mutateAsync({
          roleId: role.id,
          data: { permissionIds }
        });
      } else {
        await removePermissionsMutation.mutateAsync({
          roleId: role.id,
          data: { permissionIds }
        });
      }
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const exportMatrix = () => {
    if (!roles || !permissionGroups) return;

    const csvContent = [
      // Header row
      ['Role', ...filteredPermissionGroups.flatMap(g => g.permissions.map(p => `${g.resource}:${p.action}`))],
      // Data rows
      ...filteredRoles.map(role => [
        role.name,
        ...filteredPermissionGroups.flatMap(g => 
          g.permissions.map(p => matrix[role.id]?.[p.id] ? 'Yes' : 'No')
        )
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'role-permission-matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permission Matrix
          </DialogTitle>
          <DialogDescription>
            View and manage permissions across all roles in a comprehensive matrix view
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 py-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search roles or permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {allResources.map(resource => (
                <SelectItem key={resource} value={resource}>
                  {resource.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRoleType} onValueChange={setSelectedRoleType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportMatrix} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Matrix */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-32" />
                  <div className="flex gap-2">
                    {[...Array(8)].map((_, j) => (
                      <Skeleton key={j} className="h-6 w-6" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-w-full">
              {/* Header */}
              <div className="sticky top-0 bg-background border-b">
                <div className="flex">
                  <div className="w-48 p-3 font-semibold border-r">Role</div>
                  {filteredPermissionGroups.map(group => (
                    <div key={group.resource} className="border-r">
                      <div className="p-2 bg-muted font-medium text-center border-b">
                        {group.resource.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="flex">
                        {group.permissions.map(permission => (
                          <div
                            key={permission.id}
                            className="w-20 p-1 text-xs text-center border-r border-muted"
                            title={`${permission.action}: ${permission.description || ''}`}
                          >
                            {permission.action.replace('_', ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-0">
                {filteredRoles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No roles match your current filters
                  </div>
                ) : (
                  filteredRoles.map(role => (
                    <div key={role.id} className="flex border-b hover:bg-muted/50">
                      <div className="w-48 p-3 border-r">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.name}</span>
                          {role.isSystemRole && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {role.permissions.length} permissions
                        </div>
                      </div>
                      
                      {filteredPermissionGroups.map(group => (
                        <div key={group.resource} className="border-r">
                          <div className="flex">
                            {group.permissions.map(permission => {
                              const hasPermission = matrix[role.id]?.[permission.id] || false;
                              const isUpdating = assignPermissionsMutation.isPending || 
                                               removePermissionsMutation.isPending;
                              
                              return (
                                <div
                                  key={permission.id}
                                  className="w-20 p-2 flex items-center justify-center border-r border-muted"
                                >
                                  <Checkbox
                                    checked={hasPermission}
                                    disabled={role.isSystemRole || isUpdating}
                                    onCheckedChange={() => 
                                      handlePermissionToggle(role, permission, hasPermission)
                                    }
                                    className="h-4 w-4"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {filteredRoles.length} roles × {filteredPermissionGroups.reduce((acc, g) => acc + g.permissions.length, 0)} permissions
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-green-600" />
              Granted
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <X className="h-3 w-3 text-red-600" />
              Denied
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}