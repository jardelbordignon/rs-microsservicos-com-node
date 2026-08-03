import { Injectable } from '@nestjs/common'
import { RabbitmqService } from '../rabbitmq/rabbitmq.service'
import type { IPaymentProcessingResultEvent } from './payment-result.interface'

@Injectable()
export class PaymentResultPublisher {
	private readonly EXCHANGE = 'payments'
	private readonly ROUTING_KEY = 'payment.result'

	constructor(private readonly rabbitmqService: RabbitmqService) {}

	async publish(event: IPaymentProcessingResultEvent): Promise<void> {
		await this.rabbitmqService.publishMessage(
			this.EXCHANGE,
			this.ROUTING_KEY,
			event,
		)
	}
}

