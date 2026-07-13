import { Injectable, Logger } from '@nestjs/common'
import type { IPaymentOrderMessage } from '../payment-queue.interface'
import { RabbitmqService } from '../rabbitmq/rabbitmq.service'

@Injectable()
export class PaymentQueueService {
	private readonly logger = new Logger(PaymentQueueService.name)
	private readonly ROUTING_KEY = 'payment.order'
	private readonly EXCHANGE = 'payments'

	constructor(private readonly rabbitmqService: RabbitmqService) {}

	async publishPaymentOrder(paymentOrderMessage: IPaymentOrderMessage) {
		this.logger.log(`Publishing payment orderId: ${paymentOrderMessage.orderId}`)

		try {
			const enrichedPaymentOrderMessage: IPaymentOrderMessage = {
				...paymentOrderMessage,
				createdAt: paymentOrderMessage.createdAt || new Date(),
				metadata: {
					service: 'checkout-service',
					timestamp: new Date().toISOString(),
				},
			}

			await this.rabbitmqService.publishMessage(
				this.EXCHANGE, // para onde enviar
				this.ROUTING_KEY, // como rotear
				enrichedPaymentOrderMessage, // o que enviar,
			)

			this.logger.log(`
				✅ Payment order published successfully
				orderId: ${paymentOrderMessage.orderId}
				amount: ${paymentOrderMessage.amount}
				userId: ${paymentOrderMessage.userId}
				`)

			this.logger.debug(
				`Payment order details: ${JSON.stringify(enrichedPaymentOrderMessage)}`,
			)
		} catch (error) {
			this.logger.error('❌ Error publishing payment order:', error)
			throw error
		}
	}

	private validatePaymentOrderMessage(paymentOrderMessage: IPaymentOrderMessage) {
		if (!paymentOrderMessage.orderId) {
			this.logger.error('❌ Invalid payment order message: orderId is required')
			return false
		}

		if (!paymentOrderMessage.userId) {
			this.logger.error('❌ Invalid payment order message: userId is required')
			return false
		}

		if (!paymentOrderMessage.amount) {
			this.logger.error('❌ Invalid payment order message: invalid amount')
			return false
		}

		if (!paymentOrderMessage.items || paymentOrderMessage.items.length === 0) {
			this.logger.error('❌ Invalid payment order message: no items')
			return false
		}

		return true
	}

	async publishPaymentOrderSafe(paymentOrderMessage: IPaymentOrderMessage) {
		if (!this.validatePaymentOrderMessage(paymentOrderMessage)) {
			throw new Error('Invalid payment order message')
		}

		await this.publishPaymentOrder(paymentOrderMessage)
	}
}
