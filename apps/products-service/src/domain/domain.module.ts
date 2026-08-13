import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { MetricsModule } from './metrics/metrics.module'
import { ProductsModule } from './products/products.module'

@Module({
	imports: [HealthModule, ProductsModule, MetricsModule],
	controllers: [],
})
export class DomainModule {}
