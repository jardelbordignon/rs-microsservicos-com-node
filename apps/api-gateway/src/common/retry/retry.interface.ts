export interface IRetryOptions {
	backoffMultiplier: number
	baseDelay: number
	jitter: boolean
	maxDelay: number
	maxRetries: number
}

export interface IRetryResult<T> {
	attempts: number
	data?: T
	error?: Error
	success: boolean
	totalTime: number
}
