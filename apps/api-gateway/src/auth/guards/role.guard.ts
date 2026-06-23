import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { FastifyRequest } from 'fastify'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RoleGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const targets = [context.getHandler(), context.getClass()]

		const requiredRoles = this.reflector.getAllAndOverride<string[]>(
			ROLES_KEY,
			targets,
		)

		if (!requiredRoles) {
			return true
		}

		const { user } = context.switchToHttp().getRequest<FastifyRequest>()

		if (!user?.role) {
			throw new ForbiddenException('User role not found')
		}

		if (!requiredRoles.includes(user.role)) {
			throw new ForbiddenException(
				`Access denied. Required roles: ${requiredRoles.join(', ')}`,
			)
		}

		return true
	}
}
