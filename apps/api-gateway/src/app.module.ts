import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { LoggingMiddleware } from './middleware/logging/logging.middleware'
import { MiddlewareModule } from './middleware/middleware.module'
import { ProxyModule } from './proxy/proxy.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (envs: ConfigService) => [
				{
					name: 'short',
					ttl: 1000, // 1 second
					limit: envs.get('RATE_LIMIT_SHORT', 10), // requests per second
				},
				{
					name: 'medium',
					ttl: 60000, // 1 minute
					limit: envs.get('RATE_LIMIT_MEDIUM', 100), // requests per minute
				},
				{
					name: 'long',
					ttl: 900000, // 15 minutes
					limit: envs.get('RATE_LIMIT_LONG', 1000), // 1000 requests per 15 minutes
				},
			],
		}),
		ProxyModule,
		MiddlewareModule,
		AuthModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggingMiddleware).forRoutes('*')
	}
}
