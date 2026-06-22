import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
	protected async getTracker(req: Record<string, any>): Promise<string> {
		const isExpress = typeof req.get === 'function'

		const userAgent = isExpress
			? req.get('User-Agent')
			: req.headers['user-agent']

		return `${req.ip}-${userAgent}`
	}
}
