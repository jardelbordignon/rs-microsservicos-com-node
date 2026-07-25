import { Injectable } from '@nestjs/common'
import type { IUserInfo } from '@/interfaces/auth.interface'
import { ProxyService } from '@/proxy/service/proxy.service'
import { CreateProductDto } from './dtos/create-product.dto'

@Injectable()
export class ProductsService {
	constructor(private readonly proxyService: ProxyService) {}

	async getProducts(userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'products',
			method: 'GET',
			path: '/products',
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	async getProductsBySeller(
		sellerId: string,
		userInfo?: IUserInfo,
		authorization?: string,
	) {
		return this.proxyService.proxyRequest({
			serviceName: 'products',
			method: 'GET',
			path: `/products/seller/${sellerId}`,
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	async getProductById(id: string, userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'products',
			method: 'GET',
			path: `/products/${id}`,
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	async createProduct(
		dto: CreateProductDto,
		userInfo?: IUserInfo,
		authorization?: string,
	) {
		return this.proxyService.proxyRequest({
			serviceName: 'products',
			method: 'POST',
			path: '/products',
			data: dto,
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}
}
