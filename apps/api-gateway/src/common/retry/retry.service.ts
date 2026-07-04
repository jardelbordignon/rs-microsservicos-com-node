import { Injectable, Logger } from '@nestjs/common'
import { createDelay } from '@/utils/functions'
import { IRetryOptions, IRetryResult } from './retry.interface'

type TExecuteProps<T> = {
	operation: () => Promise<T>
	options: Partial<IRetryOptions>
}

type TExecuteWithExponentialBackoffProps<T> = {
	operation: () => Promise<T>
	maxRetries: number
}

@Injectable()
export class RetryService {
	private readonly logger = new Logger(RetryService.name)
	private readonly defaultOptions: IRetryOptions = {
		backoffMultiplier: 2,
		baseDelay: 1000,
		jitter: true,
		maxDelay: 30000,
		maxRetries: 3,
	}

	private calculateDelay(attempt: number, options: IRetryOptions) {
		const { backoffMultiplier, baseDelay, jitter, maxDelay } = options

		// delay is equal to the base delay multiplied by the backoff multiplier raised to the power of the attempt number.
		let delay = baseDelay * backoffMultiplier ** attempt

		// apply jitter to prevent thundering herd problem
		if (jitter) {
			const jitterFactor = 0.5 + Math.random() * 0.5 // number between 0.5 and 1
			delay = delay * jitterFactor
		}

		return Math.min(delay, maxDelay)

		// Segue a AWS Architecture Blog
	}

	async execute<T>({
		operation,
		options,
	}: TExecuteProps<T>): Promise<IRetryResult<T>> {
		const mergedOptions = { ...this.defaultOptions, ...options }
		const { maxRetries } = mergedOptions
		const startTime = Date.now()
		let lastError: Error | null = null

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			const attemptInfo = `${attempt + 1} of ${maxRetries}`

			try {
				this.logger.log(`Attempt ${attemptInfo}`)

				const data = await operation()
				const totalTime = Date.now() - startTime

				this.logger.log(
					`Operation succeeded on attempt ${attemptInfo} in ${totalTime}ms`,
				)

				return { attempts: attempt + 1, data, success: true, totalTime }
			} catch (error) {
				lastError = error as Error
				this.logger.warn(`Attempt ${attemptInfo} failed: ${lastError.message}`)

				if (attempt < maxRetries) {
					const delay = this.calculateDelay(attempt, mergedOptions)
					this.logger.debug(`Attempt ${attemptInfo} waiting ${delay}ms before retry`)
					await createDelay(delay)
				}
			}
		}
		throw lastError
	}

	async executeWithExponentialBackoff<T>({
		operation,
		maxRetries,
	}: TExecuteWithExponentialBackoffProps<T>): Promise<T> {
		const result = await this.execute<T>({ operation, options: { maxRetries } })

		if (!result.success) {
			throw result.error
		}

		return result.data as T
	}
}
