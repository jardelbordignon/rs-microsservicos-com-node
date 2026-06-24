import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { IUser, IUserSession } from '@/interfaces/auth.interface'

/**
 * @description Decorator to get the authenticated user or some property
 * @param prop - The desired user property
 */
export const CurrentUser = createParamDecorator(
	(prop: keyof IUser, ctx: ExecutionContext) => {
		const { user } = ctx.switchToHttp().getRequest<IUserSession>()
		return prop ? user?.[prop] : user
	},
)
