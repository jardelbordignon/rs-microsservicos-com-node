import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware'
import { MetricsModule } from './metrics/metrics.module'
import { UsersModule } from './users/users.module'

@Module({
	imports: [HealthModule, UsersModule, MetricsModule],
	controllers: [],
})
export class DomainModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(HttpMetricsMiddleware).forRoutes('*')
	}
}
