import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

/**
 * @description Decorator to set the required roles to access a route
 * @param roles - The required roles
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
