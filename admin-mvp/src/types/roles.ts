export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  isSystemRole?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isSystemRole?: boolean;
  permissionIds?: string[];
}

export interface RoleFormData {
  name: string;
  description: string;
  isSystemRole: boolean;
  permissionIds: string[];
}

export interface PermissionAssignmentData {
  permissionIds: string[];
}

export interface RolePermissionMatrix {
  [roleId: string]: {
    [permissionId: string]: boolean;
  };
}

export interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

export interface RoleStats {
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
  totalPermissions: number;
}

export interface RoleFilters {
  search?: string;
  isSystemRole?: boolean;
  hasPermissions?: boolean;
}

export interface RoleSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}