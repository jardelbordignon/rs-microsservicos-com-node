import { HttpService } from '@nestjs/axios'
import {
	Injectable,
	NotFoundException,
	ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'
import type { IProduct } from './interfaces/product.interface'

@Injectable()
export class ProductsClientService {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
	) {}

	async getProduct(productId: string): Promise<IProduct> {
		const productsServiceUrl = this.configService.get<string>('PRODUCTS_SERVICE_URL')

		try {
			const { data } = await firstValueFrom(
				this.httpService.get<IProduct>(`${productsServiceUrl}/products/${productId}`),
			)

			return data
		} catch (error) {
			const status = error?.response?.status

			if (status === 404) {
				throw new NotFoundException('Produto nao encontrado')
			}

			throw new ServiceUnavailableException(
				'Nao foi possivel consultar o products-service',
			)
		}
	}
}
