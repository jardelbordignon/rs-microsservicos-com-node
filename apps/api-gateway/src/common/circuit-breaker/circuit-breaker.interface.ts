export enum ECircuitBreakerState {
	CLOSED = 'CLOSED',
	OPEN = 'OPEN',
	HALF_OPEN = 'HALF-OPEN',
}

export interface ICircuitBreakerOptions {
	failureThreshold: number // numero tentativas para mudar para Open
	timeout: number // tempo em ms para considerar falha em uma chamada
	resetTimeout: number // tempo que o disjuntor deve permanecer no estado Open antes de tentar mudar para Half-open e depois Closed
}

export interface ICircuitBreaker {
	state: ECircuitBreakerState
	failureCount: number
	lastFailureTime: number
	nextAttemptTime: number
}

export interface ICircuitBreakerResult<T> {
	success: boolean
	data?: T
	error?: Error
	fromCache?: boolean
}
