import { Injectable, Logger } from '@nestjs/common'
import {
	ECircuitBreakerState,
	type ICircuitBreaker,
	type ICircuitBreakerOptions,
} from './circuit-breaker.interface'

@Injectable()
export class CircuitBreakerService {
	private readonly logger = new Logger(CircuitBreakerService.name)
	private readonly circuits = new Map<string, ICircuitBreaker>()
	private readonly defaultOptions: ICircuitBreakerOptions = {
		failureThreshold: 5,
		timeout: 60000,
		resetTimeout: 30000,
	}

	private getOrCreateCircuit(key: string, { timeout }: ICircuitBreakerOptions) {
		const circuitBreakerData: ICircuitBreaker = {
			state: ECircuitBreakerState.CLOSED,
			failureCount: 0,
			lastFailureTime: 0,
			nextAttemptTime: Date.now() + timeout,
		}

		if (!this.circuits.has(key)) {
			this.circuits.set(key, circuitBreakerData)
		}

		return this.circuits.get(key) ?? circuitBreakerData
	}

	private onSuccess(circuit: ICircuitBreaker, key: string) {
		circuit.failureCount = 0
		circuit.state = ECircuitBreakerState.CLOSED
		this.logger.debug(`Circuit breaker SUCCESS for ${key}, state: ${circuit.state}`)
	}

	private onFailure(
		circuit: ICircuitBreaker,
		key: string,
		options: ICircuitBreakerOptions,
	) {
		circuit.failureCount++
		circuit.lastFailureTime = Date.now()
		if (circuit.failureCount >= options.failureThreshold) {
			circuit.state = ECircuitBreakerState.OPEN
			circuit.nextAttemptTime = Date.now() + options.resetTimeout
			this.logger.warn(
				`Circuit breaker OPENED for ${key} after ${circuit.failureCount} failures`,
			)
		}
	}

	async execute<T>({
		fallback,
		key,
		operation,
		options = this.defaultOptions,
	}: {
		fallback?: () => T
		key: string
		operation: () => Promise<T>
		options?: ICircuitBreakerOptions
	}) {
		const config = { ...this.defaultOptions, ...options }
		const circuit = this.getOrCreateCircuit(key, config)

		if (circuit.state === ECircuitBreakerState.OPEN) {
			const circuitOpenMsg = `Circuit breaker OPEN for ${key}`

			if (Date.now() < circuit.nextAttemptTime) {
				this.logger.warn(`${circuitOpenMsg}${fallback ? ', using fallback' : ''}`)

				if (fallback) {
					return await fallback()
				}

				throw new Error(circuitOpenMsg)
			} else {
				circuit.state = ECircuitBreakerState.HALF_OPEN
				this.logger.warn(`Circuit breaker HALF_OPEN for ${key}`)
			}
		}

		try {
			const result = await operation()
			this.onSuccess(circuit, key)
			return result
		} catch (error) {
			this.onFailure(circuit, key, config)
			this.logger.error(`Circuit breaker failure for $${key}:`, error.message)
			if (fallback) {
				this.logger.log(`Using fallback for ${key}`)
				return await fallback()
			}
			throw error
		}
	}

	getCircuit(key: string): ICircuitBreaker | undefined {
		return this.circuits.get(key)
	}

	getCircuits(): Map<string, ICircuitBreaker> {
		return new Map(this.circuits)
	}

	resetCircuit(key: string): void {
		this.circuits.delete(key)
		this.logger.log(`Circuit breaker RESET for ${key}`)
	}
}
