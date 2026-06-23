import {
	createParamDecorator,
	ExecutionContext,
	SetMetadata,
} from '@nestjs/common'
import type { TUserSession } from '@/auth/services/auth.service'

/**
 * @description Decorator to get the authenticated user or some property
 * @param prop - The desired user property
 */
export const CurrentUser = createParamDecorator(
	(prop: keyof TUserSession['user'], ctx: ExecutionContext) => {
		const { user } = ctx.switchToHttp().getRequest<TUserSession>()
		return prop ? user?.[prop] : user
	},
)
