import {
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { IUserInfo } from '@/interfaces/auth.interface'
import type { AddOrRemoveCartItemDto } from './dtos/add-or-remove-cart-item.dto'
import { Cart } from './entities/cart.entity'
import { CartItem } from './entities/cart-item.entity'
import { ECartStatus } from './enums/cart-status.enum'
import { ProductsClientService } from './products-client.service'

@Injectable()
export class CartService {
	constructor(
		@InjectRepository(Cart)
		private readonly cartRepository: Repository<Cart>,
		@InjectRepository(CartItem)
		private readonly cartItemRepository: Repository<CartItem>,
		private readonly productsClientService: ProductsClientService,
	) {}

	private buildUninitializedCartResponse(userId: string): Cart {
		const now = new Date()
		return {
			id: '',
			userId,
			status: ECartStatus.UNINITIALIZED,
			amount: 0,
			items: [],
			createdAt: now,
			updatedAt: now,
		}
	}

	private async getOrCreateCart(user: IUserInfo): Promise<Cart> {
		let cart = await this.findActiveCart(user.id)

		if (!cart) {
			const cartData = this.cartRepository.create({
				userId: user.id,
				status: ECartStatus.ACTIVE,
				amount: 0,
				items: [],
			})
			cart = await this.cartRepository.save(cartData)
		}

		return cart
	}

	async changeCartStatus(userId: string, status: ECartStatus) {
		await this.cartRepository.update({ userId }, { status })
	}

	async findActiveCart(userId: string) {
		return this.cartRepository.findOne({
			where: {
				userId,
				status: ECartStatus.ACTIVE,
			},
		})
	}

	async getCart(user: IUserInfo): Promise<Cart> {
		const cart = await this.findActiveCart(user.id)

		if (!cart) {
			return this.buildUninitializedCartResponse(user.id)
		}

		return cart
	}

	async addItem(user: IUserInfo, dto: AddOrRemoveCartItemDto): Promise<Cart> {
		const product = await this.productsClientService.getProduct(dto.productId)

		if (!product.isActive) {
			throw new UnprocessableEntityException(
				'Produto inativo não pode ser adicionado',
			)
		}

		if (dto.quantity > product.stock) {
			throw new UnprocessableEntityException(
				'Quantidade solicitada é maior que o estoque disponível',
			)
		}

		const productPriceInCents = Math.abs(product.price * 100)
		const cart = await this.getOrCreateCart(user)
		const item = cart.items.find(({ productId }) => productId === dto.productId)

		if (item) {
			item.quantity = item.quantity + dto.quantity

			if (item.quantity > product.stock) {
				throw new UnprocessableEntityException(
					'Quantidade solicitada maior que o estoque disponivel',
				)
			}

			item.productName = product.name
			item.price = productPriceInCents
			item.subtotal = productPriceInCents * item.quantity

			await this.cartItemRepository.save(item)
			cart.items = cart.items.map((i) => (i.productId === item.productId ? item : i))
			cart.amount = cart.items.reduce((acc, item) => acc + item.subtotal, 0)
			await this.cartRepository.save(cart)
		} else {
			const cartItem = this.cartItemRepository.create({
				cartId: cart.id,
				productId: product.id,
				productName: product.name,
				price: productPriceInCents,
				quantity: dto.quantity,
				subtotal: productPriceInCents * dto.quantity,
			})

			await this.cartItemRepository.save(cartItem)
			cart.items.push(cartItem)
			cart.amount = cart.items.reduce((acc, item) => acc + item.subtotal, 0)
			await this.cartRepository.save(cart)
		}

		return this.getCart(user)
	}

	async removeItem(user: IUserInfo, dto: AddOrRemoveCartItemDto): Promise<Cart> {
		const cart = await this.findActiveCart(user.id)

		if (!cart) {
			throw new NotFoundException('Carrinho ativo nao encontrado')
		}

		const item = cart.items.find((i) => i.productId === dto.productId)

		if (!item) {
			throw new NotFoundException('Item do carrinho nao encontrado')
		}

		if (dto.quantity > item.quantity) {
			throw new UnprocessableEntityException(
				'Tentando remover mais do que a quantidade disponível no carrinho',
			)
		}

		if (item.quantity === dto.quantity) {
			await this.cartItemRepository.remove(item)
			cart.items = cart.items.filter((i) => i.productId !== item.productId)
		} else {
			item.quantity -= dto.quantity
			item.subtotal = item.price * item.quantity
			await this.cartItemRepository.save(item)
			cart.items = cart.items.map((i) => (i.productId === item.productId ? item : i))
		}

		if (cart.items.length === 0) {
			await this.cartRepository.remove(cart)
			return this.buildUninitializedCartResponse(user.id)
		} else {
			cart.amount = cart.items.reduce((acc, item) => acc + item.subtotal, 0)
			await this.cartRepository.save(cart)
		}

		return cart
	}
}
