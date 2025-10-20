import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Permission, PermissionGroup } from '@/types/roles';

// API functions
const permissionsApi = {
  getPermissions: async (): Promise<Permission[]> => {
    // Note: This endpoint might need to be added to the backend
    // For now, we'll try to get permissions from the role service
    const response = await apiClient.get('/admin/roles');
    const roles = response.data;
    
    // Extract unique permissions from all roles
    const permissionsMap = new Map<string, Permission>();
    roles.forEach((role: any) => {
      role.permissions?.forEach((permission: Permission) => {
        permissionsMap.set(permission.id, permission);
      });
    });
    
    return Array.from(permissionsMap.values());
  },
};

// Query keys
export const permissionQueryKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionQueryKeys.all, 'list'] as const,
};

// Hooks
export const usePermissions = () => {
  return useQuery({
    queryKey: permissionQueryKeys.lists(),
    queryFn: permissionsApi.getPermissions,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions change less frequently
  });
};

// Helper hook to group permissions by resource
export const usePermissionGroups = () => {
  const { data: permissions, ...rest } = usePermissions();

  const permissionGroups: PermissionGroup[] = permissions
    ? permissions.reduce((groups: PermissionGroup[], permission) => {
        const existingGroup = groups.find(g => g.resource === permission.resource);
        
        if (existingGroup) {
          existingGroup.permissions.push(permission);
        } else {
          groups.push({
            resource: permission.resource,
            permissions: [permission],
          });
        }
        
        return groups;
      }, [])
    : [];

  return {
    data: permissionGroups,
    permissions,
    ...rest,
  };
};