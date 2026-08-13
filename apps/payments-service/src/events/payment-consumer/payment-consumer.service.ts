import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EPaymentStatus } from '@/domain/payments/enums/payment-status.enum'
import { PaymentsService } from '@/domain/payments/payments.service'
import { MetricsService } from '../metrics/metrics.service'
import { PaymentQueueService } from '../payment-queue/payment-queue.service'
import { IPaymentOrderMessage } from '../payment-queue.interface'
import type { IPaymentProcessingResultEvent } from '../payment-result/payment-result.interface'
import { PaymentResultPublisher } from '../payment-result/payment-result.publisher'
import { RabbitmqService } from '../rabbitmq/rabbitmq.service'

@Injectable()
export class PaymentConsumerService implements OnModuleInit {
	private readonly logger = new Logger(PaymentConsumerService.name)

	constructor(
		private readonly paymentQueueService: PaymentQueueService,
		private readonly rabbitmqService: RabbitmqService,
		private readonly metricsService: MetricsService,
		private readonly paymentsService: PaymentsService,
		private readonly paymentResultPublisher: PaymentResultPublisher,
	) {}

	async onModuleInit() {
		this.logger.log(`🚀 Starting Payment Consumer Service`)
		await this.startConsuming()
	}

	private async startConsuming() {
		try {
			this.logger.log(`👂 Starting to consume payment orders from queue`)

			const isConnected = await this.rabbitmqService.waitForConnection()

			if (!isConnected) {
				this.logger.error(`❌ Could not connect to RabbitMQ after multiple attempts`)
				return
			}

			// Registra o callback para processar cada mensagem
			// O .bind(this) garante que o 'this' dentro do callback seja esta classe
			// porque no js quando uma função recebe uma função como parametro, é preciso informar qual o contexto 'this' está sendo referindo, qual é a classe mãe dessa função
			await this.paymentQueueService.consumePaymentOrders(
				this.processPaymentOrder.bind(this),
			)

			this.logger.log(`✅ Payment Consumer Service started successfully`)
		} catch (error) {
			this.logger.error(`❌ Failed to start consuming payment orders:`, error)
		}
	}

	/**
	 * processPaymentOrder processa as mensagens de pedido de pagamento,
	 * é chamado a cada mensagem que chega na fila,
	 * deve ser idempotente para evitar processamentos duplicados
	 */
	private async processPaymentOrder(paymentOrderMessage: IPaymentOrderMessage) {
		const startTime = Date.now()

		try {
			if (!this.validateMessage(paymentOrderMessage)) {
				throw new Error('Invalid payment message received')
			}

			const payment = await this.paymentsService.processPayment(paymentOrderMessage)
			await this.publishResultEventIfNeeded(payment)
			this.metricsService.updateMetrics(true, startTime)
		} catch (error) {
			this.metricsService.updateMetrics(false, startTime)

			const err = error as Error
			this.logger.error(
				`❌ Failed to process payment for order ${paymentOrderMessage.orderId}: ${err.message}:`,
				err.stack,
			)

			// IMPORTANTE: Relançar o erro para o RabbitMQ fazer o NACK (Tira da fila e trata de alguma forma)
			throw err
		}
	}

	private validateMessage(paymentOrderMessage: IPaymentOrderMessage) {
		const { amount, items, orderId, paymentMethod, userId } = paymentOrderMessage

		if (!orderId) {
			this.logger.error('Missing orderId in payment message')
			return false
		}

		if (!userId) {
			this.logger.error('Missing userId in payment message')
			return false
		}

		const parsedAmount = typeof amount === 'number' ? amount : Number(amount)

		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
			this.logger.error('Invalid amount in payment message')
			return false
		}

		if (!paymentMethod) {
			this.logger.error('Missing paymentMethod in payment message')
			return false
		}

		if (!items?.length) {
			this.logger.error('No items in payment message')
			return false
		}

		return true
	}

	private async publishResultEventIfNeeded(payment: {
		id: string
		orderId: string
		status: EPaymentStatus
		transactionId: string | null
		rejectionReason: string | null
		processedAt: Date | null
		resultEventPublishedAt: Date | null
	}) {
		if (payment.status === EPaymentStatus.PENDING) {
			return
		}

		if (!payment.processedAt) {
			return
		}

		if (payment.resultEventPublishedAt) {
			return
		}

		const event: IPaymentProcessingResultEvent = {
			orderId: payment.orderId,
			paymentId: payment.id,
			status: payment.status,
			processedAt: payment.processedAt.toISOString(),
			...(payment.transactionId ? { transactionId: payment.transactionId } : {}),
			...(payment.rejectionReason
				? { rejectionReason: payment.rejectionReason }
				: {}),
		}

		await this.paymentResultPublisher.publish(event)
		await this.paymentsService.tryMarkResultEventPublished(payment.id)
	}
}
