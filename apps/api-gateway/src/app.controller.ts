import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { ProxyService } from './proxy/service/proxy.service'

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly proxyService: ProxyService,
	) {}

	@Get()
	getHello(): string {
		return this.appService.getHello()
	}

	@Get('health')
	async getHealth() {
		const users = await this.proxyService.getServiceHealth('users')
		const products = await this.proxyService.getServiceHealth('products')
		const checkout = await this.proxyService.getServiceHealth('checkout')
		const payments = await this.proxyService.getServiceHealth('payments')

		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			services: { users, products, checkout, payments },
		}
	}
}
