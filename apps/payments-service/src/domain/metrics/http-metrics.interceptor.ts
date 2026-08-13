import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import { Observable, tap } from 'rxjs'
import { MetricsService } from './metrics.service'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
	constructor(private readonly metricsService: MetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const req = context.switchToHttp().getRequest()
		const { url } = req

		if (url === '/metrics') {
			return next.handle()
		}

		const startTime = process.hrtime.bigint()

		return next.handle().pipe(
			tap({
				next: () => {
					this.recordMetrics(req, context, startTime)
				},
				error: () => {
					this.recordMetrics(req, context, startTime)
				},
			}),
		)
	}

	private recordMetrics(
		req: FastifyRequest,
		context: ExecutionContext,
		startTime: bigint,
	): void {
		const res = context.switchToHttp().getResponse()
		//const route = (req.route as { path?: string })?.path || req.url // Express
		const route = req.url // Fastify
		const method = req.method
		const statusCode = res.statusCode?.toString() || '500'
		const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000_000

		const labels = { method, route, status_code: statusCode }
		this.metricsService.httpRequestsTotal.inc(labels)
		this.metricsService.httpRequestDuration.observe(labels, duration)
	}
}
