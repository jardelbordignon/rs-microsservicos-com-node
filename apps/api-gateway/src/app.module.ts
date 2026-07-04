import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module'
import { FallbackModule } from './common/fallback/fallback.module'
import { HealthCheckModule } from './common/health-check/health-check.module'
import { RetryModule } from './common/retry/retry.module'
import { TimeoutModule } from './common/timeout/timeout.module'
import { CustomThrottlerGuard } from './guards/throttler.guard'
import { HealthModule } from './health/health.module'
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
					limit: envs.get('RATE_LIMIT_SHORT', 10), // RATE_LIMIT_SHORT or 10 requests per ttl time
				},
				{
					name: 'medium',
					ttl: 60000, // 1 minute
					limit: envs.get('RATE_LIMIT_MEDIUM', 100), // RATE_LIMIT_MEDIUM or 100 requests per ttl time
				},
				{
					name: 'long',
					ttl: 900000, // 15 minutes
					limit: envs.get('RATE_LIMIT_LONG', 1000), // RATE_LIMIT_LONG or 1000 requests per ttl time
				},
			],
		}),
		ProxyModule,
		MiddlewareModule,
		AuthModule,
		FallbackModule,
		HealthCheckModule,
		HealthModule,
		CircuitBreakerModule,
		TimeoutModule,
		RetryModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: CustomThrottlerGuard,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggingMiddleware).forRoutes('*')
	}
}
