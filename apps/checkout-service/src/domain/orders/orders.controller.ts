import {
	Body,
	Controller,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import type { FastifyRequest } from 'fastify'
import { CheckoutCartDto } from './dtos/checkout-cart.dto'
import type { Order } from './entities/order.entity'
import { OrdersService } from './orders.service'

const orderSchema: Record<string, unknown> = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'uuid' },
		userId: { type: 'string', format: 'uuid' },
		cartId: { type: 'string', format: 'uuid' },
		amount: { type: 'integer', example: 3998 },
		status: { type: 'string', example: 'pending' },
		paymentMethod: { type: 'string', example: 'pix' },
		createdAt: { type: 'string', format: 'date-time' },
		updatedAt: { type: 'string', format: 'date-time' },
	},
}

const ordersListSchema: Record<string, unknown> = {
	type: 'array',
	items: orderSchema,
}

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Endpoint({
		type: 'Post',
		body: CheckoutCartDto,
		summary: 'Finalizar carrinho e criar pedido',
		responses: [
			{
				status: HttpStatus.CREATED,
				description: 'Pedido criado e evento publicado para pagamento',
				schema: orderSchema,
			},
			{
				status: HttpStatus.BAD_REQUEST,
				description:
					'Payload invalido (ex: paymentMethod fora do conjunto permitido)',
			},
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Token ausente ou invalido',
			},
			{
				status: HttpStatus.UNPROCESSABLE_ENTITY,
				description: 'Carrinho ativo vazio ou inexistente',
			},
		],
	})
	async checkoutCart(
		@Req() req: FastifyRequest,
		@Body() dto: CheckoutCartDto,
	): Promise<Order> {
		return this.ordersService.checkoutCart(req.user, dto.paymentMethod)
	}

	@Endpoint({
		type: 'Get',
		summary: 'Listar pedidos do usuario autenticado',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Lista de pedidos do usuario (mais recentes primeiro)',
				schema: ordersListSchema,
			},
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Token ausente ou invalido',
			},
		],
	})
	async listOrders(@Req() req: FastifyRequest): Promise<Order[]> {
		return this.ordersService.listOrders(req.user)
	}

	@Endpoint({
		type: 'Get',
		path: ':id',
		summary: 'Consultar detalhe de um pedido do usuario autenticado',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Pedido encontrado',
				schema: orderSchema,
			},
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Token ausente ou invalido',
			},
			{
				status: HttpStatus.NOT_FOUND,
				description: 'Pedido nao encontrado ou nao pertence ao usuario',
			},
		],
	})
	async getOrderById(
		@Req() req: FastifyRequest,
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
	): Promise<Order> {
		return this.ordersService.getOrderById(req.user, id)
	}
}
