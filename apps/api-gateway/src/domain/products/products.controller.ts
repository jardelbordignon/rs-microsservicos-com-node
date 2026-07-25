import {
	Body,
	Controller,
	Headers,
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
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Public()
	@Endpoint({
		type: 'Get',
		summary: 'Listar produtos ativos do catalogo',
		responses: [
			{ status: HttpStatus.OK, description: 'Produtos retornados com sucesso' },
		],
	})
	async getProducts(
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		return this.productsService.getProducts(req.user, authorization)
	}

	@Public()
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
	async getProductsBySeller(
		@Param('sellerId') sellerId: string,
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		return this.productsService.getProductsBySeller(sellerId, req.user, authorization)
	}

	@Public()
	@Endpoint({
		type: 'Get',
		path: ':id',
		summary: 'Buscar produto por ID',
		responses: [
			{ status: HttpStatus.OK, description: 'Produto retornado com sucesso' },
			{ status: HttpStatus.NOT_FOUND, description: 'Produto nao encontrado' },
		],
	})
	async getProductById(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		return this.productsService.getProductById(id, req.user, authorization)
	}

	@Endpoint({
		type: 'Post',
		summary: 'Criar um produto',
		responses: [
			{ status: HttpStatus.CREATED, description: 'Produto criado com sucesso' },
			{ status: HttpStatus.BAD_REQUEST, description: 'Dados invalidos' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou invalido' },
			{ status: HttpStatus.FORBIDDEN, description: 'Usuario nao e seller' },
		],
	})
	async createProduct(
		@Body() createProductDto: CreateProductDto,
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		console.log('createProduct', createProductDto)
		return this.productsService.createProduct(
			createProductDto,
			req.user,
			authorization,
		)
	}
}
