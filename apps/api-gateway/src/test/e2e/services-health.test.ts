// import type { NestFastifyApplication } from '@nestjs/platform-fastify'
// import request from 'supertest'
// import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
// import { createTestApp } from '../helpers/create-test-app'
// import { startStubServer } from '../helpers/stub-server'

// describe('Health Services (e2e)', () => {
// 	let app: NestFastifyApplication

// 	let closeUsers: (() => Promise<void>) | undefined
// 	let closeProducts: (() => Promise<void>) | undefined
// 	let closeCheckout: (() => Promise<void>) | undefined
// 	let closePayments: (() => Promise<void>) | undefined

// 	beforeAll(async () => {
// 		const users = await startStubServer(async (server) => {
// 			server.get('/health', async () => ({ status: 'ok' }))
// 		})
// 		const products = await startStubServer(async (server) => {
// 			server.get('/health', async () => ({ status: 'ok' }))
// 		})
// 		const checkout = await startStubServer(async (server) => {
// 			server.get('/health', async () => ({ status: 'ok' }))
// 		})
// 		const payments = await startStubServer(async (server) => {
// 			server.get('/health', async () => ({ status: 'ok' }))
// 		})

// 		closeUsers = users.close
// 		closeProducts = products.close
// 		closeCheckout = checkout.close
// 		closePayments = payments.close

// 		process.env.USERS_SERVICE_URL = users.baseUrl
// 		process.env.PRODUCTS_SERVICE_URL = products.baseUrl
// 		process.env.CHECKOUT_SERVICE_URL = checkout.baseUrl
// 		process.env.PAYMENTS_SERVICE_URL = payments.baseUrl

// 		vi.resetModules()

// 		const created = await createTestApp()
// 		app = created.app
// 	})

// 	afterAll(async () => {
// 		await app.close()
// 		await closeUsers?.()
// 		await closeProducts?.()
// 		await closeCheckout?.()
// 		await closePayments?.()
// 	})

// 	it('GET /health/services retorna overallStatus healthy quando todos os serviços respondem /health', async () => {
// 		const response = await request(app.getHttpServer())
// 			.get('/health/services')
// 			.expect(200)

// 		expect(response.body.overallStatus).toBe('healthy')
// 		expect(response.body.summary).toEqual(
// 			expect.objectContaining({
// 				total: 4,
// 				healthy: 4,
// 				unhealthy: 0,
// 			}),
// 		)
// 	})
// })
