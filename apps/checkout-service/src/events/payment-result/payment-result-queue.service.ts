import { Injectable, Logger } from '@nestjs/common'
import { RabbitmqService } from '../rabbitmq/rabbitmq.service'

@Injectable()
export class PaymentResultQueueService {
	private readonly logger = new Logger(PaymentResultQueueService.name)
	private readonly ROUTING_KEY = 'payment.result'
	private readonly EXCHANGE = 'payments'
	private readonly QUEUE_NAME = 'payment_result_queue'

	constructor(private readonly rabbitmqService: RabbitmqService) {}

	async consumePaymentResults(
		callback: (paymentResultEvent: string) => Promise<void>,
	): Promise<void> {
		this.logger.log('📡 Setting up payment result consumer...')

		await this.rabbitmqService.subscribeToQueue(
			{
				exchange: this.EXCHANGE,
				queueName: this.QUEUE_NAME,
				routingKey: this.ROUTING_KEY,
			},
			callback,
		)

		this.logger.log('✅ Payment result consumer is ready')
	}
}
