import type { AuthUser } from './auth';

export function hasRole(user: AuthUser, roles: string[]): boolean {
  return roles.includes(user.role);
}
