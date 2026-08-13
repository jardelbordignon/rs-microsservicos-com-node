import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { CheckoutModule } from './checkout/checkout.module'
import { HealthModule } from './health/health.module'
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware'
import { MetricsModule } from './metrics/metrics.module'
import { ProductsModule } from './products/products.module'
import { UsersModule } from './users/users.module'

@Module({
	imports: [HealthModule, ProductsModule, UsersModule, CheckoutModule, MetricsModule],
	controllers: [],
})
export class DomainModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(HttpMetricsMiddleware).forRoutes('*')
	}
}
