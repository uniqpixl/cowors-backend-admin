'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield, Search } from 'lucide-react';
import { useCreateRole, useUpdateRole } from '@/hooks/useRoles';
import { usePermissionGroups } from '@/hooks/usePermissions';
import { Role, RoleFormData } from '@/types/roles';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  mode: 'create' | 'edit';
}

export function RoleModal({ isOpen, onClose, role, mode }: RoleModalProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    isSystemRole: false,
    permissionIds: [],
  });
  const [searchTerm, setSearchTerm] = useState('');

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const { data: permissionGroups, isLoading: permissionsLoading } = usePermissionGroups();

  const isLoading = createRoleMutation.isPending || updateRoleMutation.isPending;

  // Initialize form data when role changes
  useEffect(() => {
    if (mode === 'edit' && role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        isSystemRole: role.isSystemRole,
        permissionIds: role.permissions.map(p => p.id),
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isSystemRole: false,
        permissionIds: [],
      });
    }
    setSearchTerm('');
  }, [role, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'create') {
        await createRoleMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          isSystemRole: formData.isSystemRole,
          permissionIds: formData.permissionIds,
        });
      } else if (role) {
        await updateRoleMutation.mutateAsync({
          id: role.id,
          data: {
            name: formData.name,
            description: formData.description || undefined,
            isSystemRole: formData.isSystemRole,
            permissionIds: formData.permissionIds,
          },
        });
      }
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: checked
        ? [...prev.permissionIds, permissionId]
        : prev.permissionIds.filter(id => id !== permissionId),
    }));
  };

  const handleSelectAllInGroup = (groupPermissionIds: string[], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: checked
        ? [...new Set([...prev.permissionIds, ...groupPermissionIds])]
        : prev.permissionIds.filter(id => !groupPermissionIds.includes(id)),
    }));
  };

  // Filter permissions based on search
  const filteredGroups = permissionGroups?.map(group => ({
    ...group,
    permissions: group.permissions.filter(permission =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.action.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(group => group.permissions.length > 0) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {mode === 'create' ? 'Create New Role' : 'Edit Role'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new role and assign permissions to control user access.'
              : 'Update role details and modify assigned permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="systemRole" className="flex items-center gap-2">
                  System Role
                  <Badge variant="secondary" className="text-xs">
                    Protected
                  </Badge>
                </Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="systemRole"
                    checked={formData.isSystemRole}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isSystemRole: checked }))
                    }
                  />
                  <Label htmlFor="systemRole" className="text-sm text-muted-foreground">
                    System roles cannot be deleted
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role's purpose and responsibilities"
                rows={3}
              />
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Select permissions to grant to this role
                </p>
              </div>
              <Badge variant="outline">
                {formData.permissionIds.length} selected
              </Badge>
            </div>

            {/* Permission Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Permissions List */}
            {permissionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading permissions...</span>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? 'No permissions match your search' : 'No permissions available'}
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const groupPermissionIds = group.permissions.map(p => p.id);
                    const selectedInGroup = groupPermissionIds.filter(id => 
                      formData.permissionIds.includes(id)
                    ).length;
                    const allSelected = selectedInGroup === groupPermissionIds.length;
                    const someSelected = selectedInGroup > 0 && selectedInGroup < groupPermissionIds.length;

                    return (
                      <div key={group.resource} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected;
                              }}
                              onCheckedChange={(checked) => 
                                handleSelectAllInGroup(groupPermissionIds, checked as boolean)
                              }
                            />
                            <h4 className="font-medium capitalize">
                              {group.resource.replace('_', ' ')}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {selectedInGroup}/{group.permissions.length}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                          {group.permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={formData.permissionIds.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(permission.id, checked as boolean)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <Label className="text-sm font-medium">
                                  {permission.action.replace('_', ' ')}
                                </Label>
                                {permission.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim()}
              className="bg-[#d4203d] hover:bg-[#b91c3a]"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Create Role' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}