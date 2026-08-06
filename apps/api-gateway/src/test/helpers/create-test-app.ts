import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import supertest from 'supertest'
import type TestAgent from 'supertest/lib/agent'
import { AppModule } from '../../app.module'
import { appConfig } from '../../config/app.config'

export type TTestApp = TestAgent<supertest.Test>

export async function createTestApp() {
	const testingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile()

	const app = testingModule.createNestApplication<NestFastifyApplication>(
		new FastifyAdapter(),
	)

	appConfig(app)

	await app.init()
	await app.getHttpAdapter().getInstance().ready()

	return supertest(app.getHttpServer())
}
