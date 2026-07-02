import { Controller, HttpStatus, Param } from '@nestjs/common'
import type { TServiceName } from '@/config/gateway.config'
import { Endpoint } from '@/utils/endpoint.decorator'
import { HealthService } from './health.service'

@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Endpoint({
		type: 'Get',
		path: '/',
		summary: 'Check health of the gateway',
		description: 'Check if the gateway is healthy',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Gateway is healthy',
			},
		],
	})
	getHealth() {
		return this.healthService.getHealth()
	}

	@Endpoint({
		type: 'Get',
		path: '/services',
		summary: 'Check health of the services',
		description: 'Check if the services are healthy',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Services are healthy',
			},
		],
	})
	getServicesHealth() {
		return this.healthService.getServicesHealth()
	}

	@Endpoint({
		type: 'Get',
		path: '/services/:serviceName',
		summary: 'Check health of a specific service',
		description: 'Check if a specific service is healthy',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Service is healthy',
			},
		],
	})
	async getServiceHealth(@Param('serviceName') serviceName: TServiceName) {
		return this.healthService.getServiceHealth(serviceName)
	}

	/**
	 * Verifica se o container foi orquestrado e o Gateway está de prontidão, pronto para processar requisições http
	 */
	@Endpoint({
		type: 'Get',
		path: '/ready',
		summary: 'Get the readiness status',
		description: 'Get the readiness status of the gateway',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Readiness status retrieved successfully',
			},
		],
	})
	async getReady() {
		return this.healthService.getReady()
	}

	/**
	 * Verifica se o container está vivo e rodando
	 * se o processo está respondendo
	 * se não há deadlocks ou travamentos
	 * se a aplicação não entrou em um estado irrecuperável
	 * caso essa verificação falhe, o container será reiniciado
	 */
	@Endpoint({
		type: 'Get',
		path: '/live',
		summary: 'Get the liveness status',
		description: 'Get the liveness status of the gateway',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Liveness status retrieved successfully',
			},
		],
	})
	async getLive() {
		return this.healthService.getLive()
	}
}
