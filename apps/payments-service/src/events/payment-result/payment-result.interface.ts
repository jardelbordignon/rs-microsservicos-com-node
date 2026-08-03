export type TPaymentProcessingResultStatus = 'approved' | 'rejected'

export interface IPaymentProcessingResultEvent {
	orderId: string
	paymentId: string
	status: TPaymentProcessingResultStatus
	transactionId?: string
	rejectionReason?: string
	processedAt: string
}

