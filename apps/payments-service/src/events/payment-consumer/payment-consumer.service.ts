import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PaymentQueueService } from '../payment-queue/payment-queue.service'
import { IPaymentOrderMessage } from '../payment-queue.interface'
import { RabbitmqService } from '../rabbitmq/rabbitmq.service'

export interface IConsumerMetrics {
	totalProcessed: number // Total de mensagens processadas
	totalSuccess: number // Mensagens processadas com sucesso
	totalFailed: number // Mensagens que falharam
	totalRetries: number // Total de tentativas do retry
	lastProcessedAt: Date | null // Timestamp do último processamento
	startedAt: Date // Quando o consumer iniciou
	averageProcessingTime: number // Tempo médio de processamento em ms
}

const baseMetrics: IConsumerMetrics = {
	averageProcessingTime: 0,
	lastProcessedAt: null,
	startedAt: new Date(),
	totalFailed: 0,
	totalProcessed: 0,
	totalRetries: 0,
	totalSuccess: 0,
}

@Injectable()
export class PaymentConsumerService implements OnModuleInit {
	private readonly logger = new Logger(PaymentConsumerService.name)

	/**
	 * ==========================
	 * MÉTRICAS DE MONITORAMENTO
	 * ==========================
	 * Armazena estatísticas de processamento em memória (é um estudo, entedendo os conceitos)
	 * Em produção, usaríamos Promethes, DataDog, etc.
	 */
	private metrics = baseMetrics

	/**
	 * Acumulador para calcular tempo médio de processamento
	 * Guardamos a soma total para não precisar armazenar todos os tempos
	 */
	private totalProcessingTime = 0

	constructor(
		private readonly paymentQueueService: PaymentQueueService,
		private readonly rabbitmqService: RabbitmqService,
	) {}

	async onModuleInit() {
		this.logger.log(`🚀 Starting Payment Consumer Service`)
		this.metrics.startedAt = new Date()
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
		const { amount, orderId, userId } = paymentOrderMessage

		const startTime = Date.now()

		try {
			this.logger.log(
				`📝 Processing payment order: orderId=${orderId}, userId=${userId}, amount=${amount}`,
			)

			// valida a mensagem antes de processar
			if (!this.validateMessage(paymentOrderMessage)) {
				throw new Error('Invalid payment message received')
			}

			this.logger.log(`✅ Payment order received and validated`)
			// TODO: Processar pagamento usando PaymentsService
			this.updateMetrics(true, startTime)
		} catch (error) {
			this.updateMetrics(false, startTime)

			const err = error as Error
			this.logger.error(
				`❌ Failed to process payment for order ${orderId}: ${err.message}:`,
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

		if (!amount || amount <= 0) {
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

	private updateMetrics(success: boolean, startTime: number) {
		// Incrementa contadores
		this.metrics.totalProcessed++
		this.metrics.lastProcessedAt = new Date()

		if (success) {
			this.metrics.totalSuccess++
		} else {
			this.metrics.totalFailed++
		}

		// Atualiza tempo médio de processamento
		const processingTime = Date.now() - startTime
		this.totalProcessingTime += processingTime
		this.metrics.averageProcessingTime = Math.round(
			this.totalProcessingTime / this.metrics.totalProcessed,
		)

		// Log de métricas a cada 10 mensagens
		if (this.metrics.totalProcessed % 10 === 0) {
			this.logMetricsSummary()
		}
	}

	incrementRetryCount() {
		this.metrics.totalRetries++
	}

	private logMetricsSummary() {
		const successRate =
			this.metrics.totalProcessed > 0
				? ((this.metrics.totalSuccess / this.metrics.totalProcessed) * 100).toFixed(2)
				: '0'

		this.logger.log(`📊 ==== CONSUMER METRICS ====`)
		this.logger.log(`	Total Processed: ${this.metrics.totalProcessed}`)
		this.logger.log(`	Success: ${this.metrics.totalSuccess}`)
		this.logger.log(`	Failed: ${this.metrics.totalFailed}`)
		this.logger.log(`	Retries: ${this.metrics.totalRetries}`)
		this.logger.log(`	Success Rate: ${successRate}`)
		this.logger.log(`	Avg Processing Time: ${this.metrics.averageProcessingTime}`)
		this.logger.log(`📊 ==========================`)
	}

	getMetrics(): IConsumerMetrics {
		// retorna uma cópia para evitar modificações externas
		return { ...this.metrics }
	}

	resetMetrics() {
		this.metrics = baseMetrics
		this.totalProcessingTime = 0
		this.logger.log('🔄 Metrics reset')
	}
}
