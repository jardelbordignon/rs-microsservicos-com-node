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
import { Public } from '@/auth/decorators/public.decorator'
import { CreateProductDto } from './dtos/create-product.dto'
import { ProductsService } from './products.service'

@ApiTags('Products')
@ApiBearerAuth('bearer')
@Controller('products')
export class ProductsController {
	constructor(private productsService: ProductsService) {}

	@Endpoint({
		type: 'Get',
		summary: 'Listar produtos ativos do catálogo',
		responses: [
			{ status: HttpStatus.OK, description: 'Produtos retornados com sucesso' },
		],
	})
	@Public()
	async getProducts() {
		return this.productsService.findAllActive()
	}

	@Endpoint({
		type: 'Get',
		path: 'seller/:sellerId',
		summary: 'Listar produtos ativos de um vendedor',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Produtos do vendedor retornados com sucesso',
			},
		],
	})
	@Public()
	async getProductsBySeller(@Param('sellerId') sellerId: string) {
		return this.productsService.findActiveBySeller(sellerId)
	}

	@Endpoint({
		type: 'Get',
		path: ':id',
		summary: 'Buscar produto por ID',
		responses: [
			{ status: HttpStatus.OK, description: 'Produto retornado com sucesso' },
			{ status: HttpStatus.NOT_FOUND, description: 'Produto não encontrado' },
		],
	})
	@Public()
	async getProductById(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.productsService.findById(id)
	}

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
