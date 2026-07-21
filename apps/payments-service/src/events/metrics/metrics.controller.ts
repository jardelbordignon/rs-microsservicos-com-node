import { Controller, Logger } from '@nestjs/common'
import { Endpoint } from '@repo/utils'
import { MetricsService } from './metrics.service'

@Controller('metrics')
export class MetricsController {
	private readonly logger = new Logger(MetricsController.name)

	constructor(private readonly metricsService: MetricsService) {}

	@Endpoint({
		type: 'Get',
		summary: 'Get metrics',
	})
	getMetrics() {
		const metrics = this.metricsService.getMetrics()
		return metrics
	}

	@Endpoint({
		type: 'Post',
		path: 'reset',
		summary: 'Reset metrics',
	})
	resetMetrics() {
		this.metricsService.resetMetrics()
		this.logger.warn('⚠️ Metrics were reset by API call')

		return {
			success: true,
			message: 'Metrics reset successfully',
		}
	}

	@Endpoint({
		type: 'Get',
		path: 'health',
		summary: 'Get health status',
	})
	getHealth() {
		const health = this.metricsService.getHealth()
		return health
	}

	@Endpoint({
		type: 'Get',
		path: 'summary',
		summary: 'Get summary',
	})
	getSummary() {
		const summary = this.metricsService.getSummary()
		return summary
	}
}
