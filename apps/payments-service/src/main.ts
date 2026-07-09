import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { appConfig } from './config/app.config'

async function bootstrap() {
	const logger = new Logger('PaymentsService')

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	)

	appConfig(app)

	const port = Number(process.env.PORT || 4004)

	await app.listen(port, '0.0.0.0').then(async () => {
		globalThis.baseUrl = await app.getUrl()

		logger.log(`
 💳 Payments Service running on: ${globalThis.baseUrl}
    `)
	})
}
bootstrap()
