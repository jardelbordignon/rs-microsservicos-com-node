import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { IUserInfo } from '@/interfaces/auth.interface'
import { ERole } from '@/interfaces/auth.interface'
import { CreateProductDto } from './dtos/create-product.dto'
import { Product } from './entities/product.entity'

@Injectable()
export class ProductsService {
	constructor(
		@InjectRepository(Product)
		private productsRepository: Repository<Product>,
	) {}

	async create(
		createProductDto: CreateProductDto,
		user: IUserInfo,
	): Promise<Product> {
		if (user.role !== ERole.SELLER) {
			throw new ForbiddenException('Apenas sellers podem criar produtos')
		}

		const productData = this.productsRepository.create({
			name: createProductDto.name,
			description: createProductDto.description,
			price: createProductDto.price.toFixed(2),
			stock: createProductDto.stock,
			sellerId: user.id,
			isActive: true,
		})

		return this.productsRepository.save(productData)
	}
}
