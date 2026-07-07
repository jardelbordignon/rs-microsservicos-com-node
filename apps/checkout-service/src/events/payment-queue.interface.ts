interface IPaymentOrderItem {
	productId: string
	quantity: number
	price: number
}

interface IPaymentOrderMetadata {
	service: string
	timestamp: string
}

export interface IPaymentOrderMessage {
	orderId: string
	userId: string
	amount: number
	items: IPaymentOrderItem[]
	paymentId: string
	description?: string
	createdAt?: Date
	metadata?: IPaymentOrderMetadata
}
