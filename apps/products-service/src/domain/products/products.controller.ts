import { Body, Controller, HttpStatus, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import type { FastifyRequest } from 'fastify'
import { CreateProductDto } from './dtos/create-product.dto'
import { ProductsService } from './products.service'

@ApiTags('Products')
@ApiBearerAuth('bearer')
@Controller('products')
export class ProductsController {
	constructor(private productsService: ProductsService) {}

	@Endpoint({
		type: 'Post',
		summary: 'Criar um produto',
		responses: [
			{ status: HttpStatus.CREATED, description: 'Produto criado com sucesso' },
			{ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou inválido' },
			{ status: HttpStatus.FORBIDDEN, description: 'Usuário não é seller' },
		],
	})
	async createProduct(
		@Body() createProductDto: CreateProductDto,
		@Req() req: FastifyRequest,
	) {
		return this.productsService.create(createProductDto, req.user)
	}
}
