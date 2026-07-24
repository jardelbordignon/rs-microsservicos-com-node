import { ValidationPipe } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

export function appConfig(app: NestFastifyApplication) {
	app.enableCors()

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	)
}
