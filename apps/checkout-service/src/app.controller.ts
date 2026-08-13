import { Body, Controller, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import { Public } from '@/auth/decorators/public.decorator'
import { PaymentQueueService } from './events/payment-queue/payment-queue.service'
import type { IPaymentOrderMessage } from './events/payment-queue.interface'

@ApiTags('App')
@ApiBearerAuth()
@Controller()
export class AppController {
	constructor(private readonly paymentQueueService: PaymentQueueService) {}

	@Public()
	@Endpoint({
		type: 'Post',
		path: 'test/send-message',
		summary: 'Publicar mensagem de teste no RabbitMQ',
		responses: [
			{
				status: HttpStatus.CREATED,
				description: 'Mensagem enviada para o RabbitMQ',
			},
		],
	})
	async sendMessage(@Body() body: Partial<IPaymentOrderMessage> = {}) {
		const paymentOrderMessage: IPaymentOrderMessage = {
			amount: body.amount ?? '19.99',
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
