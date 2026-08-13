import type { ServerResponse } from 'node:http'
import { Injectable, NestMiddleware } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { MetricsService } from './metrics.service'

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
	constructor(private readonly metricsService: MetricsService) {}

	use(req: FastifyRequest, res: ServerResponse, next: () => void) {
		if (req.originalUrl === '/metrics') {
			return next()
		}

		const startTime = process.hrtime.bigint()

		res.on('finish', () => {
			//const route = (req as any).route?.path || req.originalUrl?.split('?')[0] // Express
			const route = req.routeOptions?.url || req.url.split('?')[0] // Fastify
			const method = req.method
			const statusCode = res.statusCode.toString()
			const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000_000

			const labels = { method, route, status_code: statusCode }
			this.metricsService.httpRequestsTotal.inc(labels)
			this.metricsService.httpRequestDuration.observe(labels, duration)
		})

		next()
	}
}
