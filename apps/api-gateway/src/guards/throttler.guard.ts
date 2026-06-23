import { Injectable } from '@nestjs/common'
import {
	ThrottlerException,
	ThrottlerGuard,
	type ThrottlerRequest,
} from '@nestjs/throttler'

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
	protected async getTracker(req: Record<string, any>): Promise<string> {
		const isExpress = typeof req.get === 'function'

		const userAgent = isExpress
			? req.get('User-Agent')
			: req.headers['user-agent']

		return `${req.ip}-${userAgent}`
	}

	protected async handleRequest({
		context,
		limit,
		ttl,
	}: ThrottlerRequest): Promise<boolean> {
		const { req, res } = this.getRequestResponse(context)

		// Get the Throttler decorator data
		const throttlers = this.reflector.get('throttle', context.getHandler())
		const throttlerName = throttlers ? Object.keys(throttlers)[0] : 'default'

		const tracker = await this.getTracker(req)
		const key = this.generateKey(context, tracker, throttlerName)

		const { totalHits } = await this.storageService.increment(
			key,
			ttl,
			limit,
			1,
			throttlerName,
		)

		const ttlInSeconds = Math.round(ttl / 1000)

		const isExpress = typeof res.setHeader === 'function'

		const setHeader = (name: string, value: any) =>
			isExpress ? res.setHeader(name, value) : res.header(name, value)

		if (totalHits > limit) {
			setHeader('Retry-After', ttlInSeconds)
			throw new ThrottlerException()
		}

		setHeader(`${this.headerPrefix}-Limit`, limit)
		setHeader(`${this.headerPrefix}-Remaining`, limit - totalHits)
		setHeader(`${this.headerPrefix}-Reset`, ttlInSeconds)

		return true
	}
}
