import { Body, Controller, Get, Post } from '@nestjs/common'
import { AppService } from './app.service'
import { PaymentQueueService } from './events/payment-queue/payment-queue.service'
import type { IPaymentOrderMessage } from './events/payment-queue.interface'

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly paymentQueueService: PaymentQueueService,
	) {}

	@Get()
	getHello(): string {
		return this.appService.getHello()
	}

	@Post('test/send-message')
	async sendMessage(@Body() body: Partial<IPaymentOrderMessage> = {}) {
		const paymentOrderMessage: IPaymentOrderMessage = {
			amount: body.amount ?? 19.99,
			orderId: body.orderId ?? `test-order-${Date.now()}`,
			userId: body.userId ?? 'test-user-123',
			items: body.items ?? [
				{
					price: 19.99,
					quantity: 1,
					productId: 'test-product-123',
				},
			],
			paymentMethod: body.paymentMethod ?? 'credit-card',
			description: body.description ?? 'Test payment',
			createdAt: new Date(),
			metadata: {
				service: 'test-service',
				timestamp: new Date().toISOString(),
			},
		}

		await this.paymentQueueService.publishPaymentOrder(paymentOrderMessage)

		return {
			success: true,
			message: 'Mensagem enviada para o RabbitMQ',
			data: paymentOrderMessage,
		}
	}
}
