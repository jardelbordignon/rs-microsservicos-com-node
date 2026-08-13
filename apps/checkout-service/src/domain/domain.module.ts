import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { CartModule } from './cart/cart.module'
import { HealthModule } from './health/health.module'
import { MetricsModule } from './metrics/metrics.module'
import { OrdersModule } from './orders/orders.module'
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware'

@Module({
	imports: [AuthModule, CartModule, OrdersModule, HealthModule, MetricsModule],
})
export class DomainModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(HttpMetricsMiddleware).forRoutes('*')
	}
}