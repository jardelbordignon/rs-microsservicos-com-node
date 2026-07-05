import { Injectable, Logger } from '@nestjs/common'
import { createDelay } from '@/utils/functions'
import type { ITimeoutOptions } from './timeout.interface'

type TExecuteProps<T> = {
	operation: () => Promise<T>
	options: Partial<ITimeoutOptions>
}

type TExecuteWithOnlyTimeoutProps<T> = {
	operation: () => Promise<T>
	timeout: number
}

@Injectable()
export class TimeoutService {
	private readonly logger = new Logger(TimeoutService.name)
	private readonly defaultOptions: ITimeoutOptions = {
		timeout: 5000, // 5 seconds
		retries: 3,
		backoffMultiplier: 2,
		maxBackoff: 30000, // 30 seconds
	}

	private async createTimeoutPromise(timeout: number): Promise<never> {
		return new Promise((_, reject) => {
			setTimeout(
				() => reject(new Error(`Operation timed out after ${timeout}ms`)),
				timeout,
			)
		})
	}

	/*
	 * Execute an operation with timeout, retry and backoff strategy
	 */
	async execute<T>({
		operation,
		options = this.defaultOptions,
	}: TExecuteProps<T>): Promise<T> {
		const mergedOptions = { ...this.defaultOptions, ...options }
		const { backoffMultiplier, maxBackoff, retries, timeout } = mergedOptions

		let lastError: Error | null = null
		let delay = 1000 // start with 1 second

		for (let attempt = 0; attempt <= retries; attempt++) {
			const attemptInfo = `${attempt + 1} of ${retries}`

			try {
				this.logger.debug(`Executing operation ${attemptInfo}`)

				const result = await Promise.race([
					operation(),
					this.createTimeoutPromise(timeout),
				])

				if (attempt > 0) {
					this.logger.log(`Operation succeeded on attempt ${attemptInfo}`)
				}

				return result as T
			} catch (error) {
				lastError = error as Error
				this.logger.warn(`Attempt ${attemptInfo} failed: ${lastError.message}`)

				if (attempt < retries) {
					await createDelay(delay)
					delay = Math.min(delay * backoffMultiplier, maxBackoff)
				}
			}
		}

		this.logger.error(`All ${retries + 1} attempts failed`)

		throw lastError
	}

	/*
	 * Execute an operation with timeout only, no retry or backoff strategy
	 */
	async executeWithOnlyTimeout<T>({
		operation,
		timeout,
	}: TExecuteWithOnlyTimeoutProps<T>): Promise<T> {
		return Promise.race([operation(), this.createTimeoutPromise(timeout)])
	}
}
