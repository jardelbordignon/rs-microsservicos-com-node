enum ECircuitBreakerState {
	CLOSED = 'CLOSED',
	OPEN = 'OPEN',
	HALF_OPEN = 'HALF-OPEN',
}

export interface CircuitBreakerOptions {
	failureThreshold: number // numero tentativas para mudar para Open
	timeout: number // tempo em ms para considerar falha em uma chamada
	resetTimeout: number // tempo que o disjuntor deve permanecer no estado Open antes de tentar mudar para Half-open e depois Closed
}

export interface CircuitBreakerState {
	state: ECircuitBreakerState
	failureCount: number
	lastFailureTime: number
	nextAttemptTime: number
}

export interface CircuitBreakerResult<T> {
	success: boolean
	data?: T
	error?: Error
	fromCache?: boolean
}
