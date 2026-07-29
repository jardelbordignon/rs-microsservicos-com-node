import { Body, Controller, HttpStatus, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import type { FastifyRequest } from 'fastify'
import { CartService } from './cart.service'
import { AddOrRemoveCartItemDto } from './dtos/add-or-remove-cart-item.dto'

const cartItemSchema = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'uuid' },
		cartId: { type: 'string', format: 'uuid' },
		productId: { type: 'string', format: 'uuid' },
		productName: { type: 'string' },
		price: { type: 'number', example: 19.99 },
		quantity: { type: 'integer', example: 2 },
		subtotal: { type: 'number', example: 39.98 },
		createdAt: { type: 'string', format: 'date-time' },
	},
}

const cartResponseSchema = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'uuid', nullable: true },
		userId: { type: 'string', format: 'uuid' },
		status: { type: 'string', example: 'active' },
		amount: { type: 'number', example: 39.98 },
		items: {
			type: 'array',
			items: cartItemSchema,
		},
		createdAt: { type: 'string', format: 'date-time', nullable: true },
		updatedAt: { type: 'string', format: 'date-time', nullable: true },
	},
}

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
	constructor(private readonly cartService: CartService) {}

	@Endpoint({
		type: 'Post',
		path: 'items',
		body: AddOrRemoveCartItemDto,
		summary: 'Adicionar item ao carrinho ativo',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Carrinho retornado com amount atualizado',
				schema: cartResponseSchema,
			},
			{
				status: HttpStatus.BAD_REQUEST,
				description: 'Payload invalido',
			},
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Token ausente ou invalido',
			},
			{
				status: HttpStatus.NOT_FOUND,
				description: 'Produto nao encontrado',
			},
			{
				status: HttpStatus.UNPROCESSABLE_ENTITY,
				description: 'Produto inativo ou quantidade acima do estoque',
			},
		],
	})
	async addCartItem(@Req() req: FastifyRequest, @Body() dto: AddOrRemoveCartItemDto) {
		return this.cartService.addItem(req.user, dto)
	}

	@Endpoint({
		type: 'Get',
		summary: 'Consultar carrinho ativo do usuario autenticado',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Carrinho retornado com itens e amount',
				schema: cartResponseSchema,
			},
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Token ausente ou invalido',
			},
		],
	})
	async getCart(@Req() req: FastifyRequest) {
		return this.cartService.getCart(req.user)
	}

	@Endpoint({
		type: 'Delete',
		path: 'items',
		body: AddOrRemoveCartItemDto,
		summary: 'Remover item do carrinho ativo',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Carrinho atualizado retornado com amount recalculado',
				schema: cartResponseSchema,
			},
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Token ausente ou invalido',
			},
			{
				status: HttpStatus.NOT_FOUND,
				description: 'Item do carrinho nao encontrado',
			},
		],
	})
	async removeCartItem(
		@Req() req: FastifyRequest,
		@Body() dto: AddOrRemoveCartItemDto,
	) {
		return this.cartService.removeItem(req.user, dto)
	}
}
