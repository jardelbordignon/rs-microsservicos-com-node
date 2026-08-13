import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { OrdersService } from '@/domain/orders/orders.service'
import { RabbitmqService } from '../rabbitmq/rabbitmq.service'
import type { IPaymentProcessingResultEvent } from './payment-result.interface'
import { PaymentResultQueueService } from './payment-result-queue.service'

@Injectable()
export class PaymentResultConsumerService implements OnModuleInit {
	private readonly logger = new Logger(PaymentResultConsumerService.name)

	constructor(
		private readonly paymentResultQueueService: PaymentResultQueueService,
		private readonly rabbitmqService: RabbitmqService,
		private readonly ordersService: OrdersService,
	) {}

	async onModuleInit() {
		this.logger.log(`🚀 Starting Payment Result Consumer Service`)
		await this.startConsuming()
	}

	private async startConsuming() {
		try {
			this.logger.log(`👂 Starting to consume payment results from queue`)

			const isConnected = await this.rabbitmqService.waitForConnection()

			if (!isConnected) {
				this.logger.error(`❌ Could not connect to RabbitMQ after multiple attempts`)
				return
			}

			await this.paymentResultQueueService.consumePaymentResults(
				this.processPaymentResult.bind(this),
			)

			this.logger.log(`✅ Payment Result Consumer Service started successfully`)
		} catch (error) {
			this.logger.error(`❌ Failed to start consuming payment results:`, error)
		}
	}

	private async processPaymentResult(message: unknown) {
		const event = message as IPaymentProcessingResultEvent

		if (!this.validateEvent(event)) {
			throw new Error('Invalid payment result event received')
		}

		await this.ordersService.applyPaymentResult(event)
	}

	private validateEvent(event: IPaymentProcessingResultEvent) {
		if (!event?.orderId) {
			this.logger.error('Missing orderId in payment result event')
			return false
		}

		if (!event?.paymentId) {
			this.logger.error('Missing paymentId in payment result event')
			return false
		}

		if (event.status !== 'approved' && event.status !== 'rejected') {
			this.logger.error('Invalid status in payment result event')
			return false
		}

		if (!event.processedAt) {
			this.logger.error('Missing processedAt in payment result event')
			return false
		}

		return true
	}
}
