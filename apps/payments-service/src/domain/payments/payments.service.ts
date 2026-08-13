import { randomUUID } from 'node:crypto'
import {
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { IPaymentOrderMessage } from '@/events/payment-queue.interface'
import { Payment } from './entities/payment.entity'
import { EPaymentStatus } from './enums/payment-status.enum'
import { FakePaymentGatewayService } from './fake-payment-gateway.service'

@Injectable()
export class PaymentsService {
	private readonly logger = new Logger(PaymentsService.name)
	private static readonly PROCESSING_TIMEOUT_MS = 5 * 60 * 1000

	constructor(
		@InjectRepository(Payment)
		private readonly paymentRepository: Repository<Payment>,
		private readonly paymentGatewayService: FakePaymentGatewayService,
	) {}

	async processPayment(paymentOrderMessage: IPaymentOrderMessage): Promise<Payment> {
		const { orderId, paymentMethod, userId, amount } = paymentOrderMessage

		let payment = await this.paymentRepository.findOne({
			where: { orderId },
		})

		if (!payment) {
			try {
				payment = await this.paymentRepository.save(
					this.paymentRepository.create({
						orderId,
						userId,
						amount: Number(amount).toFixed(2),
						paymentMethod,
						status: EPaymentStatus.PENDING,
					}),
				)
			} catch {
				const existing = await this.paymentRepository.findOne({
					where: { orderId },
				})

				if (!existing) {
					throw new InternalServerErrorException('Failed to create payment')
				}

				payment = existing
			}
		}

		// Já foi finalizado anteriormente
		if (payment.status !== EPaymentStatus.PENDING) {
			return payment
		}

		const processingToken = randomUUID()

		const timeout = new Date(Date.now() - PaymentsService.PROCESSING_TIMEOUT_MS)

		/**
		 * Tenta adquirir o lease.
		 *
		 * O lease será adquirido quando:
		 * - ninguém estiver processando (processingStartedAt IS NULL)
		 * - ou o lease anterior expirou.
		 */
		const lease = await this.paymentRepository
			.createQueryBuilder()
			.update(Payment)
			.set({
				processingStartedAt: () => 'CURRENT_TIMESTAMP',
				processingToken,
			})
			.where('id = :id', { id: payment.id })
			.andWhere('status = :status', {
				status: EPaymentStatus.PENDING,
			})
			.andWhere(
				`
      (
        processing_started_at IS NULL
        OR processing_started_at < :timeout
      )
      `,
				{
					timeout,
				},
			)
			.execute()

		if (lease.affected === 0) {
			// Outro consumidor já está processando.
			return payment
		}

		const paymentProcessResult = await this.paymentGatewayService.processPayment({
			idempotencyKey: orderId,
			amount: Number(amount),
			paymentMethod,
		})

		const paymentUpdateData: Partial<Payment> = {
			status: paymentProcessResult.approved
				? EPaymentStatus.APPROVED
				: EPaymentStatus.REJECTED,
			rejectionReason: paymentProcessResult.approved
				? null
				: (paymentProcessResult.rejectionReason ?? 'Pagamento rejeitado'),
			transactionId: paymentProcessResult.transactionId,
			processedAt: new Date(),
			processingStartedAt: null,
			processingToken: null,
		}

		const updateResult = await this.paymentRepository
			.createQueryBuilder()
			.update(Payment)
			.set(paymentUpdateData)
			.where('id = :id', { id: payment.id })
			.andWhere('processing_token = :processingToken', { processingToken })
			.execute()

		if (updateResult.affected === 0) {
			// Perdemos o lease (outro consumidor assumiu após o timeout).
			// Não sobrescrevemos o resultado produzido por ele.
			this.logger.warn(
				`Lease perdido durante o processamento do pagamento ${payment.id}`,
			)

			return this.paymentRepository.findOneByOrFail({ id: payment.id })
		}

		Object.assign(payment, paymentUpdateData)

		return payment
	}

	async findByOrderId(orderId: string): Promise<Payment> {
		const payment = await this.paymentRepository.findOne({ where: { orderId } })

		if (!payment) {
			throw new NotFoundException('Payment not found')
		}

		return payment
	}

	async tryMarkResultEventPublished(paymentId: string): Promise<boolean> {
		const result = await this.paymentRepository
			.createQueryBuilder()
			.update(Payment)
			.set({
				resultEventPublishedAt: () => 'CURRENT_TIMESTAMP',
			})
			.where('id = :id', { id: paymentId })
			.andWhere('result_event_published_at IS NULL')
			.andWhere('status IN (:...statuses)', {
				statuses: [EPaymentStatus.APPROVED, EPaymentStatus.REJECTED],
			})
			.execute()

		return result.affected === 1
	}
}
