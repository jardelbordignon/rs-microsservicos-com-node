import { Global, Module } from '@nestjs/common'
import { HttpMetricsMiddleware } from './http-metrics.middleware'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'

@Global()
@Module({
	controllers: [MetricsController],
	providers: [MetricsService, HttpMetricsMiddleware],
	exports: [MetricsService, HttpMetricsMiddleware],
})
export class MetricsModule {}
