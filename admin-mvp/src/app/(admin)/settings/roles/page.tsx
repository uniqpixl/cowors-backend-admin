import { Metadata } from 'next'
import RoleManagementContent from '@/components/settings/roles/RoleManagementContent'

export const metadata: Metadata = {
  title: 'Roles & Permissions | Cowors Admin',
  description: 'Manage user roles and permissions',
}

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Manage user roles and their associated permissions
        </p>
      </div>
      <RoleManagementContent />
    </div>
  )
}