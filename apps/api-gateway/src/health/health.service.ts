import { Injectable } from '@nestjs/common'
import { HealthCheckService } from '@/common/health-check/health-check.service'
import { TServiceName } from '@/config/gateway.config'

@Injectable()
export class HealthService {
	constructor(private readonly healthCheckService: HealthCheckService) {}

	getHealth() {
		return {
			status: 'ok',
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

	async getReady() {
		// 	return this.healthCheckService.get()
	}

	async getLive() {
		//return this.healthCheckService.get()
	}
}
