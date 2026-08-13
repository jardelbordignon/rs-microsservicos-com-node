import { Controller, Res } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { Endpoint } from '@repo/utils'
import type { FastifyReply } from 'fastify'
import { Public } from '@/auth/decorators/public.decorator'
import { MetricsService } from './metrics.service'

@Public()
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Endpoint({
		type: 'Get',
		summary: 'Get metrics',
	})
	async getMetrics(@Res() res: FastifyReply): Promise<void> {
		const metrics = await this.metricsService.getMetrics()
		// res.set('Content-Type', this.metricsService.getContentType())
		res.type(this.metricsService.getContentType())
		res.send(metrics)
	}
}
