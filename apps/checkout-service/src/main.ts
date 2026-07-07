import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'

async function bootstrap() {
  const logger = new Logger('CheckoutService')

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	)

  const port = Number(process.env.PORT || 4003)

	await app.listen(port, '0.0.0.0').then(async () => {
		globalThis.baseUrl = await app.getUrl()

		logger.log(`
🚀 CheckoutService running on: ${globalThis.baseUrl}
    `)
	})
}
bootstrap();
