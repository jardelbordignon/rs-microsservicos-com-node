import {
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CartService } from '@/domain/cart/cart.service'
import type { CartItem } from '@/domain/cart/entities/cart-item.entity'
import { ECartStatus } from '@/domain/cart/enums/cart-status.enum'
import { PaymentQueueService } from '@/events/payment-queue/payment-queue.service'
import type { IPaymentOrderMessage } from '@/events/payment-queue.interface'
import type { IUserInfo } from '@/interfaces/auth.interface'
import { Order } from './entities/order.entity'
import { EOrderStatus } from './enums/order-status.enum'
import type { EPaymentMethod } from './enums/payment-method.enum'

@Injectable()
export class OrdersService {
	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		private readonly cartService: CartService,
		private readonly paymentQueueService: PaymentQueueService,
	) {}

	async checkoutCart(user: IUserInfo, paymentMethod: EPaymentMethod): Promise<Order> {
		const cart = await this.cartService.findActiveCart(user.id)

		if (!cart || cart.items.length === 0) {
			throw new UnprocessableEntityException('Carrinho ativo vazio ou inexistente')
		}

		const orderAmount = Math.abs(cart.amount / 100).toFixed(2)

		const order: Order = this.orderRepository.create({
			userId: user.id,
			cartId: cart.id,
			amount: orderAmount,
			paymentMethod,
			status: EOrderStatus.PENDING,
		})

		const createdOrder: Order = await this.orderRepository.save(order)

		const paymentOrderMessage: IPaymentOrderMessage = {
			orderId: createdOrder.id,
			userId: user.id,
			amount: orderAmount,
			items: cart.items.map((item: CartItem) => ({
				productId: item.productId,
				quantity: item.quantity,
				price: item.price,
			})),
			paymentMethod,
		}

		await this.cartService.changeCartStatus(user.id, ECartStatus.COMPLETED)
		await this.paymentQueueService.publishPaymentOrderSafe(paymentOrderMessage)

		return createdOrder
	}

	async listOrders(user: IUserInfo): Promise<Order[]> {
		return this.orderRepository.find({
			where: { userId: user.id },
			order: { createdAt: 'DESC' },
		})
	}

	async getOrderById(user: IUserInfo, orderId: string): Promise<Order> {
		const order: Order | null = await this.orderRepository.findOne({
			where: { id: orderId },
		})

		if (!order || order.userId !== user.id) {
			throw new NotFoundException('Pedido nao encontrado')
		}

		return order
	}
}
