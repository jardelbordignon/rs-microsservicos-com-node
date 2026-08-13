import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware'
import { MetricsModule } from './metrics/metrics.module'
import { PaymentsModule } from './payments/payments.module'

@Module({
	imports: [HealthModule, MetricsModule, PaymentsModule],
	controllers: [],
})
export class DomainModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(HttpMetricsMiddleware).forRoutes('*')
	}
}
