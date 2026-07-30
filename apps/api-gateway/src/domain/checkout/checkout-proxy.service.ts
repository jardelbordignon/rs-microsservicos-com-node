import { Injectable } from '@nestjs/common'
import type { IUserInfo } from '@/interfaces/auth.interface'
import { ProxyService } from '@/proxy/service/proxy.service'
import { AddOrRemoveCartItemDto } from './dtos/add-or-remove-cart-item.dto'
import { CheckoutCartDto } from './dtos/checkout-cart.dto'

@Injectable()
export class CheckoutProxyService {
	constructor(private readonly proxyService: ProxyService) {}

	addCartItem(
		dto: AddOrRemoveCartItemDto,
		userInfo?: IUserInfo,
		authorization?: string,
	) {
		return this.proxyService.proxyRequest({
			serviceName: 'checkout',
			method: 'POST',
			path: '/cart/items',
			data: dto,
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	getCart(userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'checkout',
			method: 'GET',
			path: '/cart',
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	removeCartItem(
		dto: AddOrRemoveCartItemDto,
		userInfo?: IUserInfo,
		authorization?: string,
	) {
		return this.proxyService.proxyRequest({
			serviceName: 'checkout',
			method: 'DELETE',
			path: '/cart/items',
			data: dto,
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	checkout(dto: CheckoutCartDto, userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'checkout',
			method: 'POST',
			path: '/orders',
			data: dto,
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	listOrders(userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'checkout',
			method: 'GET',
			path: '/orders',
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	getOrderById(id: string, userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'checkout',
			method: 'GET',
			path: `/orders/${id}`,
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}
}
