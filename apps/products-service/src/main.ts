import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { appConfig } from './config/app.config'

async function bootstrap() {
	const logger = new Logger('ProductsService')

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	)

	appConfig(app)

	const port = Number(process.env.PORT || 4004)

	await app.listen(port, '0.0.0.0').then(async () => {
		const baseUrl = await app.getUrl()

		logger.log(`📦 Products Service running on: ${baseUrl}`)
	})
}
bootstrap()
