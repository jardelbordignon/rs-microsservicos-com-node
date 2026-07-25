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

	const swaggerPageTitle = 'Users Service'

	const config = new DocumentBuilder()
		.setTitle(swaggerPageTitle)
		.setDescription('Documentação do users-service do marketplace')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'Authorization',
				description: 'Informe o token JWT',
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
			tagsSorter: 'alpha',
			operationsSorter: 'method',
			customFetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const TOKEN_KEY = 'users-service-swagger-token'

				const headers = new Headers(init?.headers)
				const token = localStorage.getItem(TOKEN_KEY)

				if (token) {
					headers.set('Authorization', `Bearer ${token}`)
				}

				const response = await fetch(input, { ...init, headers })

				if (response.url.includes('/users/login')) {
					try {
						const clone = response.clone()
						const body = await clone.json()

						if (body?.token) {
							localStorage.setItem(TOKEN_KEY, body.token)
						}
					} catch (err) {
						console.warn('Erro ao ler token do login:', err)
					}
				}

				if (response.status === 401) {
					localStorage.removeItem(TOKEN_KEY)
				}

				return response
			},
		}),
	)
}
