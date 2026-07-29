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
	amount: string
	items: IPaymentOrderItem[]
	paymentMethod: string
	createdAt?: Date
	metadata?: IPaymentOrderMetadata
}
