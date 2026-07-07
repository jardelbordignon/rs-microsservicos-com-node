interface IPaymentOrderItem {
	productId: string
	quantity: number
	price: number
}

export interface IPaymentOrderMessage {
	orderId: string
	userId: string
	amount: number
	items: IPaymentOrderItem[]
	paymentId: string
	description?: string
	createdAt?: Date
}
