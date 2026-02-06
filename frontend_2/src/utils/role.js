export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  STAFF: 'staff'
}

export const hasRole = (user, role) => {
  return user?.role === role
}

export const isAdmin = (user) => hasRole(user, ROLES.ADMIN)
export const isStaff = (user) => hasRole(user, ROLES.STAFF)