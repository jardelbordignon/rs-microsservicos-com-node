import { Injectable, Logger, NestMiddleware } from '@nestjs/common'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
	private readonly logger = new Logger('HTTP')

	use(req: any, res: any, next: () => void) {
		const { method, originalUrl, ip } = req

		//const userAgent = req.get('User-Agent') || ''
    const userAgent = req.headers['user-agent'] || ''
		const startTime = Date.now()

		this.logger.log(
			`Incoming Request: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`,
		)

		res.on('finish', () => {
			const { statusCode } = res
			//const contentLength = res.get('Content-Length') || ''
      const contentLength = res.getHeader('content-length') || ''
			const duration = Date.now() - startTime

			this.logger.log(
				`Outgoing Response: ${method} ${originalUrl} - ${statusCode} - ${contentLength || 0}b - ${duration}ms`,
			)

      if (statusCode >= 400) {
        this.logger.error(`Response Error on finish: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`)
      }
		})

    res.on('error', error => {
      this.logger.error(`Response Error: ${method} ${originalUrl} - ${error.message}`)
    })

    res.on('timeout', () => {
      this.logger.warn(`Response Timeout: ${method} ${originalUrl} - ${Date.now() - startTime}ms`)
    })

		next()
	}
}
