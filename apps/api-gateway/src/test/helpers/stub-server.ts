import type { AddressInfo } from 'node:net'
import fastify, { type FastifyInstance } from 'fastify'

export async function startStubServer(
	registerRoutes: (app: FastifyInstance) => void | Promise<void>,
) {
	const app = fastify()

	await registerRoutes(app)

	await app.listen({ port: 0, host: '127.0.0.1' })

	const address = app.server.address()
	if (!address || typeof address === 'string') {
		throw new Error('Não foi possível obter a porta do stub server')
	}

	const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`

	return {
		app,
		baseUrl,
		close: async () => {
			await app.close()
		},
	}
}
