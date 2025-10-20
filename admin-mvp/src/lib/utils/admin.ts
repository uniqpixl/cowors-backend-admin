// Admin utility functions

// Map backend roles to display roles
export const mapUserRole = (role: string) => {
  switch (role) {
    case "SuperAdmin": return "Super Admin";
    case "Admin": return "Admin";
    case "User": return "User";
    default: return role;
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case "SuperAdmin": return "error";
    case "Admin": return "success";
    default: return "primary";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "success";
    case "Suspended": return "error";
    case "Pending": return "warning";
    default: return "primary";
  }
};

export const rolePermissions = {
  SuperAdmin: ["all"],
  Admin: ["users", "bookings", "support"],
  User: []
};