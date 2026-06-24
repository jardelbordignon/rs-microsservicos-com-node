import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import type { Request, Response } from 'express'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
	private readonly logger = new Logger('HTTP')

	//constructor(private readonly adapterHost: HttpAdapterHost) {}

	use(req: Request, res: Response, next: () => void) {
		const { method, originalUrl, ip } = req

		// const isExpress =
		//   this.adapterHost.httpAdapter.getType() === 'express'
		const isExpress = typeof req.get === 'function'

		const userAgent = isExpress ? req.get('User-Agent') : req.headers['user-agent']
		const startTime = Date.now()

		this.logger.log(
			`Incoming Request: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`,
		)

		res.on('finish', () => {
			const { statusCode } = res
			const contentLength = isExpress
				? res.get('Content-Length')
				: res.getHeader('content-length')
			const duration = Date.now() - startTime

			this.logger.log(
				`Outgoing Response: ${method} ${originalUrl} - ${statusCode} - ${contentLength || 0}b - ${duration}ms`,
			)

			if (statusCode >= 400) {
				this.logger.error(
					`Response Error on finish: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
				)
			}
		})

		res.on('error', (error) => {
			this.logger.error(`Response Error: ${method} ${originalUrl} - ${error.message}`)
		})

		res.on('timeout', () => {
			this.logger.warn(
				`Response Timeout: ${method} ${originalUrl} - ${Date.now() - startTime}ms`,
			)
		})

		next()
	}
}
