import { Injectable } from '@nestjs/common'
import { EHealthStatus } from '@/common/health-check/health-check.interface'
import { HealthCheckService } from '@/common/health-check/health-check.service'
import { TServiceName } from '@/config/gateway.config'

@Injectable()
export class HealthService {
	constructor(private readonly healthCheckService: HealthCheckService) {}

	getHealth() {
		return {
			status: EHealthStatus.HEALTHY,
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			version: process.env.npm_package_version || '0.0.0',
		}
	}

	async getServicesHealth() {
		const services = await this.healthCheckService.checkAllServices()

		const healthy = services.filter((s) => s.status === 'healthy').length
		const degraded = services.filter((s) => s.status === 'degraded').length
		const unhealthy = services.filter((s) => s.status === 'unhealthy').length

		const overallStatus =
			healthy === services.length
				? 'healthy'
				: degraded > 0
					? 'degraded'
					: 'unhealthy'

		return {
			overallStatus,
			timestamp: new Date().toISOString(),
			services,
			summary: {
				total: services.length,
				healthy,
				unhealthy,
				degraded,
			},
		}
	}

	async getServiceHealth(serviceName: TServiceName) {
		const cached = this.healthCheckService.getCachedHealthCheck(serviceName)

		if (!cached) {
			return {
				status: 'unknown',
				message: 'Service not found or never checked',
				timestamp: new Date().toISOString(),
			}
		}

		return cached
	}

	private async getHealthStatus() {
		const healthChecks = await this.healthCheckService.checkAllServices()

		const results = {
			status: EHealthStatus.HEALTHY,
			timestamp: new Date().toISOString(),
			gateway: {
				status: EHealthStatus.HEALTHY,
				uptime: process.uptime(),
				memory: process.memoryUsage(),
			},
			services: {},
		}

		let hasUnhealthyServices = false

		healthChecks.forEach(({ lastCheck, name, responseTime, status, url, error }) => {
			results.services[name] = {
				status,
				responseTime,
				lastCheck,
				url,
				...(error && { error }),
			}

			if (status === EHealthStatus.UNHEALTHY) {
				hasUnhealthyServices = true
			}
		})

		if (hasUnhealthyServices) {
			results.status = EHealthStatus.DEGRADED
		}

		return results
	}

	async getReadyStatus() {
		const healthStatus = await this.getHealthStatus()

		return {
			status: healthStatus.status === EHealthStatus.HEALTHY ? 'ready' : 'not_ready',
			timestamp: new Date().toISOString(),
		}
	}

	async getLiveStatus() {
		return {
			status: 'alive',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
		}
	}
}
