import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom, timeout as rxjsTimeout } from 'rxjs'
import { serviceConfig, type TServiceName } from '@/config/gateway.config'
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service'
import { EHealthStatus, type IHealthCheck } from './health-check.interface'

@Injectable()
export class HealthCheckService {
	private readonly logger = new Logger(HealthCheckService.name)
	private readonly healthCheckCache = new Map<string, IHealthCheck>()

	constructor(
		private readonly httpService: HttpService,
		private readonly circuitBreakerService: CircuitBreakerService,
	) {}

	async checkService(serviceName: TServiceName): Promise<IHealthCheck> {
		const startTime = Date.now()
		const { timeout, url } = serviceConfig[serviceName]

		try {
			await this.circuitBreakerService.execute({
				operation: async () => {
					const { status } = await firstValueFrom(
						this.httpService
							.get(`${url}/health`, { timeout })
							.pipe(rxjsTimeout(timeout)),
					)
					return status
				},
				fallback: () => {
					throw new Error('Circuit breaker fallback')
				},
				key: `health-${serviceName}`,
			})

			const healthCheck: IHealthCheck = {
				name: serviceName,
				url,
				status: EHealthStatus.HEALTHY,
				responseTime: Date.now() - startTime,
				lastCheck: new Date(),
			}
			this.healthCheckCache.set(serviceName, healthCheck)

			return healthCheck
		} catch (error) {
			const healthCheck: IHealthCheck = {
				name: serviceName,
				url,
				status: EHealthStatus.UNHEALTHY,
				responseTime: Date.now() - startTime,
				lastCheck: new Date(),
				error: error.message,
			}
			this.healthCheckCache.set(serviceName, healthCheck)
			this.logger.error(`Health check failed for ${serviceName}`, error.message)

			return healthCheck
		}
	}

	async checkAllServices(): Promise<IHealthCheck[]> {
		const serviceNames = Object.keys(serviceConfig) as TServiceName[]

		const healthChecks = await Promise.allSettled(serviceNames.map(this.checkService))

		return healthChecks.map((result, index) => {
			if (result.status === 'fulfilled') {
				return result.value
			}
			return {
				name: serviceNames[index],
				url: serviceConfig[serviceNames[index]].url,
				status: EHealthStatus.UNHEALTHY,
				responseTime: 0,
				lastCheck: new Date(),
				error: result.reason?.message || 'Unknown error',
			}
		})
	}

	getCachedHealthCheck(serviceName: TServiceName) {
		return this.healthCheckCache.get(serviceName)
	}

	getCachedHealthChecks() {
		return Array.from(this.healthCheckCache.values())
	}
}
