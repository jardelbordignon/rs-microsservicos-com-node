import type { IUserInfo } from '@/interfaces/auth.interface'

declare module 'fastify' {
	interface FastifyRequest {
		user: IUserInfo
	}
}
