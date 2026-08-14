import { Controller, HttpStatus } from '@nestjs/common'
import {
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
} from '@nestjs/terminus'
import { Endpoint } from '@repo/utils'
import { getServiceConfig } from '@/config/gateway.config'

@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
	) {}

	@Endpoint({
		type: 'Get',
		summary: 'Check health of the services',
		description: 'Check if the services is healthy',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Services is healthy',
			},
		],
	})
	@HealthCheck()
	getHealth() {
		const { checkout, payments, products, users } = getServiceConfig()

		return this.health.check([
			() => this.http.pingCheck('checkout-service', `${checkout.url}/health`),
			() => this.http.pingCheck('payments-service', `${payments.url}/health`),
			() => this.http.pingCheck('products-service', `${products.url}/health`),
			() => this.http.pingCheck('users-service', `${users.url}/health`),
		])
	}
}
