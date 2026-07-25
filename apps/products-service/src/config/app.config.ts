import { ValidationPipe } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

export function appConfig(app: NestFastifyApplication) {
	app.enableCors()

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	)

	const swaggerPageTitle = 'Products Service'

	const config = new DocumentBuilder()
		.setTitle(swaggerPageTitle)
		.setDescription('Documentacao do microsservico de produtos do marketplace')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'Authorization',
				description: 'JWT Bearer token',
				in: 'header',
			},
			'bearer',
		)
		.build()

	const content = SwaggerModule.createDocument(app, config)

	app.use(
		'/doc',
		apiReference({
			content,
			pageTitle: swaggerPageTitle,
			withFastify: true,
			theme: 'kepler',
			authentication: {
				preferredSecurityScheme: 'bearer',
			},
		}),
	)
}
