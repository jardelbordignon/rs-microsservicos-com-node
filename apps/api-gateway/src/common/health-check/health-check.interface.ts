export enum EHealthStatus {
	HEALTHY = 'healthy',
	UNHEALTHY = 'unhealthy',
	DEGRADED = 'degraded',
}

export interface IHealthCheck {
	name: string
	url: string
	status: EHealthStatus
	responseTime: number
	lastCheck: Date
	error?: Error
}
