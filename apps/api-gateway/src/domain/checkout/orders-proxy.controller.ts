import {
	Body,
	Controller,
	Headers,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Req,
	UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import type { FastifyRequest } from 'fastify'
import { JwtAuthGuard } from '@/guards/auth.guard'
import { CheckoutProxyService } from './checkout-proxy.service'
import { CheckoutCartDto } from './dtos/checkout-cart.dto'

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersProxyController {
	constructor(private readonly checkoutProxyService: CheckoutProxyService) {}

	@Endpoint({
		type: 'Post',
		body: CheckoutCartDto,
		summary: 'Finalizar carrinho e criar pedido',
		responses: [
			{ status: HttpStatus.CREATED, description: 'Pedido criado' },
			{ status: HttpStatus.BAD_REQUEST, description: 'Payload invalido' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou invalido' },
			{
				status: HttpStatus.UNPROCESSABLE_ENTITY,
				description: 'Carrinho vazio ou inexistente',
			},
		],
	})
	checkout(
		@Req() req: FastifyRequest,
		@Body() dto: CheckoutCartDto,
		@Headers('authorization') authorization?: string,
	) {
		return this.checkoutProxyService.checkout(dto, req.user, authorization)
	}

	@Endpoint({
		type: 'Get',
		summary: 'Listar pedidos do usuario autenticado',
		responses: [
			{ status: HttpStatus.OK, description: 'Lista de pedidos do usuario' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou invalido' },
		],
	})
	listOrders(
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		return this.checkoutProxyService.listOrders(req.user, authorization)
	}

	@Endpoint({
		type: 'Get',
		path: ':id',
		summary: 'Consultar detalhe de um pedido do usuario autenticado',
		responses: [
			{ status: HttpStatus.OK, description: 'Pedido encontrado' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou invalido' },
			{ status: HttpStatus.NOT_FOUND, description: 'Pedido nao encontrado' },
		],
	})
	getOrderById(
		@Req() req: FastifyRequest,
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Headers('authorization') authorization?: string,
	) {
		return this.checkoutProxyService.getOrderById(id, req.user, authorization)
	}
}
