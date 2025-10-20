'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui';
import { Users, Shield, Edit, Trash2, Plus, Lock, Loader2 } from 'lucide-react';
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useRoles';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}



export default function RoleManagementContent() {
  // API hooks
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useRoles();
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  // Local state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });

  const handleCreateRole = () => {
    if (!newRole.name || !newRole.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    createRoleMutation.mutate(
      {
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
      },
      {
        onSuccess: () => {
          setNewRole({ name: '', description: '', permissions: [] });
          setIsCreateModalOpen(false);
        },
      }
    );
  };

  const handleEditRole = () => {
    if (!selectedRole) return;

    updateRoleMutation.mutate(
      {
        id: selectedRole.id,
        data: {
          name: selectedRole.name,
          description: selectedRole.description,
          permissions: selectedRole.permissions,
        },
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedRole(null);
        },
      }
    );
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find((r: Role) => r.id === roleId);
    if (role?.isDefault) {
      toast.error('Cannot delete default role');
      return;
    }

    deleteRoleMutation.mutate(roleId);
  };

  const togglePermission = (permissionId: string, isEdit = false) => {
    if (isEdit && selectedRole) {
      const updatedPermissions = selectedRole.permissions.includes(permissionId)
        ? selectedRole.permissions.filter(p => p !== permissionId)
        : [...selectedRole.permissions, permissionId];
      setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    } else {
      const updatedPermissions = newRole.permissions.includes(permissionId)
        ? newRole.permissions.filter(p => p !== permissionId)
        : [...newRole.permissions, permissionId];
      setNewRole({ ...newRole, permissions: updatedPermissions });
    }
  };

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {};
    permissions.forEach((permission: Permission) => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const permissionCategories = getPermissionsByCategory();

  // Loading state
  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="ml-2 text-gray-600">Loading roles and permissions...</span>
      </div>
    );
  }

  // Error state
  if (rolesError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Failed to load roles</div>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Roles List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            System Roles
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {roles.map((role: Role) => (
            <div key={role.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                    {role.isDefault && (
                      <Badge variant="light" color="info">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{role.description}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {role.userCount} users
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Lock className="w-4 h-4 mr-1" />
                      {role.permissions.length} permissions
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {role.permissions.slice(0, 3).map((permissionId) => {
                      const permission = permissions.find((p: Permission) => p.id === permissionId);
                      return permission ? (
                        <Badge key={permissionId} variant="light" color="light">
                          {permission.name}
                        </Badge>
                      ) : null;
                    })}
                    {role.permissions.length > 3 && (
                      <Badge variant="light" color="light">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!role.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      disabled={deleteRoleMutation.isPending}
                    >
                      {deleteRoleMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Role Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              <span className="sr-only">Close</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                defaultValue={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                defaultValue={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Enter role description"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="space-y-4 mt-2">
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <label key={permission.id} className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRole.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!newRole.name || !newRole.description || createRoleMutation.isPending}
              >
                {createRoleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Role'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Role</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              <span className="sr-only">Close</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Button>
          </div>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editRoleName">Role Name</Label>
                <Input
                  id="editRoleName"
                  defaultValue={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="editRoleDescription">Description</Label>
                <Input
                  id="editRoleDescription"
                  defaultValue={selectedRole.description}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  placeholder="Enter role description"
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="space-y-4 mt-2">
                  {Object.entries(permissionCategories).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <label key={permission.id} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedRole.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id, true)}
                              className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditRole}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}