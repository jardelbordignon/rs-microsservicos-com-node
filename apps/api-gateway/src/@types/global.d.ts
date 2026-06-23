import type { TUserSession } from '@/auth/services/auth.service'

declare module 'fastify' {
	interface FastifyRequest {
		user: TUserSession['user']
	}
}

export {}
