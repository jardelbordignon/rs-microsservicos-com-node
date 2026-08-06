import type { IUserInfo } from '@/interfaces/auth.interface'
import type { TTestApp } from '../test/helpers/create-test-app'

declare global {
	var testApp: TTestApp
}

declare module 'fastify' {
	interface FastifyRequest {
		user: IUserInfo
	}
}
