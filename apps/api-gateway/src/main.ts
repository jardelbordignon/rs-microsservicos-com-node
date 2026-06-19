import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { config } from './config'

async function bootstrap() {
	const logger = new Logger('Bootstrap')

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	)

	config(app)

	const port = Number(process.env.PORT ?? 4005)

	await app.listen(port, '0.0.0.0').then(async () => {
		globalThis.baseUrl = await app.getUrl()

		logger.log(`
🚀 API-Gateway running on: ${globalThis.baseUrl}
📖 Swagger documentation on: ${globalThis.baseUrl}/doc
    `)
	})
}

bootstrap()
