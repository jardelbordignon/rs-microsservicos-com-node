import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { AuthService } from '../services/auth.service'

@Injectable()
export class SessionGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<FastifyRequest>()

		const rawSessionToken = request.headers['x-session-token']
		const sessionToken = Array.isArray(rawSessionToken)
			? rawSessionToken[0]
			: rawSessionToken

		if (!sessionToken) {
			throw new UnauthorizedException('Required session token')
		}

		try {
			const session = await this.authService.validateSessionToken(sessionToken)

			if (!session.valid || !session.user) {
				throw new UnauthorizedException('Invalid session token')
			}

			request.user = session.user

			return true
		} catch (error) {
			throw new UnauthorizedException('Invalid session token')
		}
	}
}
