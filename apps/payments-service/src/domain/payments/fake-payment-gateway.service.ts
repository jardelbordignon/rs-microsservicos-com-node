import { Injectable, Logger } from '@nestjs/common'
import { createDelay } from '@repo/utils'

type TPaymentGatewayResult = {
	approved: boolean
	transactionId: string
	rejectionReason?: string
}

@Injectable()
export class FakePaymentGatewayService {
	private readonly logger = new Logger(FakePaymentGatewayService.name)

	async processPayment(props: {
		idempotencyKey: string
		amount: number
		paymentMethod: string
	}): Promise<TPaymentGatewayResult> {
		const latencyMs = 500 + Math.floor(Math.random() * 1501)
		this.logger.log(
			`Processing payment for order ${props.idempotencyKey} with amount ${props.amount.toFixed(2)} and payment method ${props.paymentMethod} - simulated latency: ${latencyMs}ms`,
		)
		await createDelay(latencyMs)

		const transactionId = `txn_${props.idempotencyKey}_${Date.now()}`

		if (props.amount > 10000) {
			return {
				approved: false,
				transactionId,
				rejectionReason: 'Limite excedido',
			}
		}

		if (props.amount.toString().endsWith('.99')) {
			return {
				approved: false,
				transactionId,
				rejectionReason: 'Cartão recusado pela operadora',
			}
		}

		return { approved: true, transactionId }
	}
}
