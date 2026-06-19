import { join } from 'node:path'
import fastifyHelmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import { ValidationPipe } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

export function config(app: NestFastifyApplication) {
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
				scriptSrc: ["'self'", "'unsafe-inline'"],
				styleSrc: ["'self'", "'unsafe-inline'"],
				imgSrc: ["'self'", 'data:'],
				fontSrc: ["'self'"],
			},
		},
	})

	app.enableCors({
		origin: process.env.CORS_ORIGINS?.split(',') || '*',
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
		}),
	)

	const config = new DocumentBuilder()
		.setTitle('Marketplace API Gateway')
		.setDescription('API Gateway for Marketplace Microservices')
		.setVersion('0.1')
		.addBearerAuth()
		.build()

	const content = SwaggerModule.createDocument(app, config)

	app.use(
		'/doc',
		apiReference({
			theme: 'purple',
			content,
			withFastify: true,
		}),
	)
}
