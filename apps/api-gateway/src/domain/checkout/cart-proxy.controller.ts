import { Body, Controller, Headers, HttpStatus, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import type { FastifyRequest } from 'fastify'
import { JwtAuthGuard } from '@/guards/auth.guard'
import { CheckoutProxyService } from './checkout-proxy.service'
import { AddOrRemoveCartItemDto } from './dtos/add-or-remove-cart-item.dto'

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartProxyController {
	constructor(private readonly checkoutProxyService: CheckoutProxyService) {}

	@Endpoint({
		type: 'Post',
		path: 'items',
		body: AddOrRemoveCartItemDto,
		summary: 'Adicionar item ao carrinho ativo',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Carrinho retornado com amount atualizado',
			},
			{ status: HttpStatus.BAD_REQUEST, description: 'Payload invalido' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou invalido' },
		],
	})
	addCartItem(
		@Req() req: FastifyRequest,
		@Body() dto: AddOrRemoveCartItemDto,
		@Headers('authorization') authorization?: string,
	) {
		return this.checkoutProxyService.addCartItem(dto, req.user, authorization)
	}

	@Endpoint({
		type: 'Get',
		summary: 'Consultar carrinho ativo do usuario autenticado',
		responses: [
			{ status: HttpStatus.OK, description: 'Carrinho retornado com itens e amount' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou invalido' },
		],
	})
	getCart(
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		return this.checkoutProxyService.getCart(req.user, authorization)
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
			},
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou invalido' },
			{
				status: HttpStatus.NOT_FOUND,
				description: 'Item do carrinho nao encontrado',
			},
		],
	})
	removeCartItem(
		@Req() req: FastifyRequest,
		@Body() dto: AddOrRemoveCartItemDto,
		@Headers('authorization') authorization?: string,
	) {
		return this.checkoutProxyService.removeCartItem(dto, req.user, authorization)
	}
}
