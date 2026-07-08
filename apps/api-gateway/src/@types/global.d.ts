import type { IUser } from '@/interfaces/auth.interface'

declare module 'fastify' {
	interface FastifyRequest {
		user: IUser
	}
}
