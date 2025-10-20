'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Settings,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRoles, useDeleteRole } from '@/hooks/useRoles';
import { Role, RoleFilters } from '@/types/roles';
import { RoleModal } from './RoleModal';
import { PermissionMatrix } from './PermissionMatrix';

export function RoleManagementContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<RoleFilters>({});
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const { data: roles, isLoading, error } = useRoles();
  const deleteRoleMutation = useDeleteRole();

  // Filter roles based on search and filters
  const filteredRoles = roles?.filter((role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSystemFilter = filters.isSystemRole === undefined || 
                               role.isSystemRole === filters.isSystemRole;
    
    const matchesPermissionFilter = filters.hasPermissions === undefined ||
                                   (filters.hasPermissions ? role.permissions.length > 0 : role.permissions.length === 0);

    return matchesSearch && matchesSystemFilter && matchesPermissionFilter;
  }) || [];

  const handleCreateRole = () => {
    setSelectedRole(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystemRole) {
      return;
    }
    
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      await deleteRoleMutation.mutateAsync(role.id);
    }
  };

  const handleOpenMatrix = () => {
    setIsMatrixOpen(true);
  };

  const stats = {
    totalRoles: roles?.length || 0,
    systemRoles: roles?.filter(r => r.isSystemRole).length || 0,
    customRoles: roles?.filter(r => !r.isSystemRole).length || 0,
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load roles. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles &amp; Permissions</h2>
          <p className="text-muted-foreground">
            Manage user roles and their permissions across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleOpenMatrix}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Permission Matrix
          </Button>
          <Button
            onClick={handleCreateRole}
            className="flex items-center gap-2 bg-[#d4203d] hover:bg-[#b91c3a]"
          >
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold">{stats.totalRoles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Settings className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Roles</p>
                <p className="text-2xl font-bold">{stats.systemRoles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Custom Roles</p>
                <p className="text-2xl font-bold">{stats.customRoles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.isSystemRole?.toString() || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({
                  ...prev,
                  isSystemRole: value === 'all' ? undefined : value === 'true'
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Role Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="true">System Roles</SelectItem>
                <SelectItem value="false">Custom Roles</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.hasPermissions?.toString() || 'all'}
              onValueChange={(value) => 
                setFilters(prev => ({
                  ...prev,
                  hasPermissions: value === 'all' ? undefined : value === 'true'
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Permissions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="true">With Permissions</SelectItem>
                <SelectItem value="false">No Permissions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Roles ({filteredRoles.length})</CardTitle>
          <CardDescription>
            Manage roles and their associated permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No roles found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating a new role'}
              </p>
              {!searchTerm && Object.keys(filters).length === 0 && (
                <div className="mt-6">
                  <Button onClick={handleCreateRole} className="bg-[#d4203d] hover:bg-[#b91c3a]">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{role.name}</h3>
                      {role.isSystemRole && (
                        <Badge variant="secondary" className="text-xs">
                          System Role
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {role.permissions.length} permissions
                      </Badge>
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(role.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRole(role)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Role
                      </DropdownMenuItem>
                      {!role.isSystemRole && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteRole(role)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Role
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={selectedRole}
        mode={modalMode}
      />

      <PermissionMatrix
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />
    </div>
  );
}