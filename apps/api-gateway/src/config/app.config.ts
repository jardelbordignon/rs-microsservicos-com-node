import { join } from 'node:path'
import fastifyHelmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import { ValidationPipe } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

export function appConfig(app: NestFastifyApplication) {
	if (process.env.FILE_STORAGE_PROVIDER === 'disk') {
		app.useStaticAssets({
			decorateReply: false,
			prefix: '/public/',
			root: join(process.cwd(), '..', '..', '..', 'public'),
			//root: join(getDirname(import.meta.url), '..', '..', '..', 'public'),
		})
	}

	app.register(multipart, {
		attachFieldsToBody: true,
		limits: {
			fileSize: 10 * 1024 * 1024,
		},
	})

	// https://blog.devgenius.io/safeguarding-your-nestjs-application-with-fastify-helmet-e354502fd056?gi=4e545ce234ba
	app.register(fastifyHelmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", 'data:', 'https:'],
				fontSrc: ["'self'"],
			},
		},
		crossOriginEmbedderPolicy: false,
		hsts: {
			maxAge: 31536000,
			includeSubDomains: true,
			preload: true,
		},
	})

	app.enableCors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true)

			const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['*']

			if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error('Not allowed by CORS'), false)
			}
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'X-Request-With',
			'Accept',
			'Origin',
			'Access-Control-Request-Method',
			'Access-Control-Request-Headers',
		],
		credentials: true,
		maxAge: 86400, // 24 hours
	})

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
		}),
	)

	const swaggerPageTitle = 'Marketplace API Gateway'

	const config = new DocumentBuilder()
		.setTitle(swaggerPageTitle)
		.setDescription(
			`
      API Gateway para o sistema de Marketplace com microserviços

      # Serviços Disponíveis:
      - Users Service: Autenticação e gestão de usuários
      - Products Service: Catálogo e gestão de produtos
      - Checkout Service: Carrinho e processamento de pedidos
      - Payments Service: Processamento de pagamentos

      # Autenticação:
      - Use JWT Bearer token para rotas protegidas
      - Use Session token para validação de sessão
      `,
		)
		.setVersion('0.1')
		.setContact(
			'Marketplace Team',
			'<https://marketplace.com>',
			'dev@marketplace.com',
		)
		.setLicense('MIT', '<https://opensource.org/licenses/MIT>')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'JWT',
				description: 'Enter JWT token',
				in: 'header',
			},
			'JWT-auth',
		)
		.addApiKey(
			{
				type: 'apiKey',
				name: 'x-session-token',
				in: 'header',
				description: 'Session token for user validation',
			},
			'session-auth',
		)
		.build()

	const content = SwaggerModule.createDocument(app, config)

	app.use(
		'/doc',
		apiReference({
			content,
			// authentication: {
			// 	preferredSecurityScheme: 'bearer',
			// },
			pageTitle: swaggerPageTitle,
			withFastify: true,
			theme: 'kepler',
			tagsSorter: 'alpha',
			operationsSorter: 'method',

			customFetch: async (input, init) => {
				const TOKEN_KEY = 'swagger-access-token'

				const headers = new Headers(init?.headers)

				const token = localStorage.getItem(TOKEN_KEY)

				if (token) {
					headers.set('Authorization', `Bearer ${token}`)
				}

				const response = await fetch(input, { ...init, headers })

				if (response.url.includes('/auth/login')) {
					try {
						const clone = response.clone()
						const body = await clone.json()

						if (body?.accessToken) {
							localStorage.setItem(TOKEN_KEY, body.accessToken)
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
