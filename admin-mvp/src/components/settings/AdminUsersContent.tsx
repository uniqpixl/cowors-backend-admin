"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { UserPlus, Shield, Key, Ban, RotateCcw, Filter } from "lucide-react";
import { toast } from "sonner";
import { useAdminUsers, useSuspendUser, useReactivateUser } from "@/hooks/useAdminUsers";
import { AdminUser } from "@/lib/api/types";

// Import reusable components and hooks
import SearchInput from "@/components/ui/search/SearchInput";
import FilterDropdown from "@/components/ui/filter/FilterDropdown";
import LoadingState from "@/components/ui/loading/LoadingState";
import ErrorState from "@/components/ui/error/ErrorState";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useListState } from "@/hooks/useListState";

// Import utility functions
import { mapUserRole, getRoleColor, getStatusColor, rolePermissions } from "@/lib/utils/admin";



export default function AdminUsersContent() {
  // Use the reusable list state hook
  const { state, actions } = useListState<AdminUser>({
    initialFilters: { search: '', role: '', status: '' },
    defaultRowsPerPage: 10
  });

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  
  // API hooks
  const { data: usersData, isLoading, isError, error } = useAdminUsers({
    search: state.filters.search,
    // Note: The backend API might not support role and status filtering directly
    // We'll handle this client-side for now
  });
  
  const suspendUserMutation = useSuspendUser();
  const reactivateUserMutation = useReactivateUser();
  
  const users = usersData?.data || [];

  // Apply client-side filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                         user.email.toLowerCase().includes(state.filters.search.toLowerCase());
    
    const matchesRole = !state.filters.role || state.filters.role === 'all' || user.role === state.filters.role;
    const matchesStatus = !state.filters.status || state.filters.status === 'all' || user.status === state.filters.status;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInviteUser = () => {
    toast.success("Invitation sent successfully!");
    setIsInviteOpen(false);
  };

  const handleSuspendUser = (userId: string) => {
    // For now, we'll just toggle between active and suspended status
    const user = users.find(u => u.id === userId);
    if (user) {
      if (user.status === "Suspended") {
        reactivateUserMutation.mutate(userId, {
          onSuccess: () => {
            toast.success("User reactivated successfully!");
          },
          onError: (error) => {
            toast.error("Failed to reactivate user: " + error.message);
          }
        });
      } else {
        suspendUserMutation.mutate({ 
          id: userId, 
          data: { 
            reason: "Admin action", 
            duration: 30 // 30 days suspension
          } 
        }, {
          onSuccess: () => {
            toast.success("User suspended successfully!");
          },
          onError: (error) => {
            toast.error("Failed to suspend user: " + error.message);
          }
        });
      }
    }
  };

  const handleResetPassword = () => {
    toast.success("Password reset email sent!");
  };

  if (isLoading) {
    return <LoadingState message="Loading admin users..." />;
  }

  if (isError) {
    return <ErrorState message={`Error loading admin users: ${error?.message}`} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Users</h1>
          <p className="text-xs text-gray-600">Manage admin accounts, roles, and permissions</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => setIsInviteOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Admin
        </Button>
        
        {isInviteOpen && (
          <Modal
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
          >
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Invite New Admin</h2>
              <div className="space-y-4">
                <p className="text-xs text-gray-600">
                  Send an invitation to create a new admin account
                </p>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" placeholder="admin@cowors.com" />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    >
                      Select role
                      <Filter className="w-4 h-4 ml-2" />
                    </Button>
                    <Dropdown
                      isOpen={isRoleDropdownOpen}
                      onClose={() => setIsRoleDropdownOpen(false)}
                    >
                      <DropdownItem onItemClick={() => setIsRoleDropdownOpen(false)}>
                        Super Admin
                      </DropdownItem>
                      <DropdownItem onItemClick={() => setIsRoleDropdownOpen(false)}>
                        Admin
                      </DropdownItem>
                      <DropdownItem onItemClick={() => setIsRoleDropdownOpen(false)}>
                        Support
                      </DropdownItem>
                      <DropdownItem onItemClick={() => setIsRoleDropdownOpen(false)}>
                        Operations
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Welcome Message (Optional)</Label>
                  <textarea
                    id="message"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Welcome to Cowors Admin..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteUser} className="bg-red-600 hover:bg-red-700 text-white">
                    Send Invitation
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={state.filters.search}
                onChange={(value) => actions.updateFilters({ search: value })}
                placeholder="Search by name or email..."
              />
            </div>
            <div className="flex gap-2">
              {/* Filters */}
              <FilterDropdown
                filters={[
                  {
                    key: 'role',
                    label: 'Role',
                    value: state.filters.role,
                    options: [
                      { value: 'all', label: 'All Roles' },
                      { value: 'SuperAdmin', label: 'Super Admin' },
                      { value: 'Admin', label: 'Admin' },
                      { value: 'User', label: 'User' }
                    ]
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    value: state.filters.status,
                    options: [
                      { value: 'all', label: 'All Statuses' },
                      { value: 'Active', label: 'Active' },
                      { value: 'Suspended', label: 'Suspended' },
                      { value: 'Pending', label: 'Pending' }
                    ]
                  }
                ]}
                onFiltersChange={(filters) => actions.updateFilters(filters)}
                onClearFilters={() => actions.updateFilters({ role: 'all', status: 'all' })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                    <Badge variant="light" color={getRoleColor(user.role)}>
                      {mapUserRole(user.role)}
                    </Badge>
                    <Badge variant="light" color={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{user.email}</p>
                  <div className="text-xs text-gray-500">
                    <span>Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</span>
                    <span className="mx-2">•</span>
                    <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsPermissionOpen(true);
                    }}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Permissions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetPassword}
                  >
                    <Key className="w-4 h-4 mr-1" />
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuspendUser(user.id)}
                  >
                    {user.status === "Suspended" ? (
                      <><RotateCcw className="w-4 h-4 mr-1" />Activate</>
                    ) : (
                      <><Ban className="w-4 h-4 mr-1" />Suspend</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Modal */}
      {isPermissionOpen && selectedUser && (
        <Modal
          isOpen={isPermissionOpen}
          onClose={() => setIsPermissionOpen(false)}
        >
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Manage Permissions - {selectedUser.firstName} {selectedUser.lastName}
            </h2>
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Configure role-based access permissions
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Current Role: {mapUserRole(selectedUser.role)}</Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Permissions are automatically assigned based on role
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Available Permissions:</h4>
                  {rolePermissions[selectedUser.role as keyof typeof rolePermissions]?.map((permission) => (
                    <div key={permission} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium capitalize">{permission}</span>
                        <p className="text-xs text-gray-600">
                          {permission === "all" ? "Full system access" : `Access to ${permission} module`}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsPermissionOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 text-center">
            <p className="text-gray-500">No admin users found matching your criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
}