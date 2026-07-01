import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class FallbackService {
	private readonly logger = new Logger(FallbackService.name)
	private readonly cache = new Map<string, { data: unknown; timestamp: number }>()

	// with cache methods
	getCachedData<T>(key: string, timeout = 3000): T | null {
		const cached = this.cache.get(key)

		if (!cached) {
			return null
		}

		const isExpired = Date.now() - cached.timestamp > timeout

		if (isExpired) {
			this.cache.delete(key)
			return null
		}

		this.logger.log(`Cache HIT for key: ${key}`)
		return cached.data as T
	}

	setCachedData(key: string, data: unknown): void {
		this.cache.set(key, { data, timestamp: Date.now() })
		this.logger.log(`Cache SET for key: ${key}`)
	}

	createCachedFallback<T>(key: string, defaultData: T, timeout = 300000) {
		const cached = this.getCachedData<T>(key, timeout)

		if (cached) {
			this.logger.log(`Using cached data for ${key}`)
			return cached
		}

		this.logger.warn(`No cached data available for ${key}, using default data`)
		return defaultData
	}

	// without cache methods
	createDefaultFallback<T>(defaultResponse: T, serviceName: string) {
		this.logger.warn(`Using default fallback for ${serviceName}`)

		return defaultResponse
	}

	createErrorFallback(serviceName: string, errorMessage: string) {
		this.logger.error(`Fallback error for ${serviceName}: ${errorMessage}`)
		throw new Error(`${serviceName} service unavailable: ${errorMessage}`)
	}

	createEmptyArrayFallback<T>(serviceName: string): T[] {
		this.logger.warn(`Using empty array fallback for ${serviceName}`)
		return []
	}

	createEmptyObjectFallback<T>(serviceName: string): T {
		this.logger.warn(`Using empty object fallback for ${serviceName}`)
		return {} as T
	}
}
