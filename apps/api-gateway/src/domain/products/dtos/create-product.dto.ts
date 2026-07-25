import { Type } from 'class-transformer'
import {
	IsDefined,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsString,
	MaxLength,
	Min,
} from 'class-validator'

export class CreateProductDto {
	@IsString({ message: 'O nome deve ser uma string' })
	@IsNotEmpty({ message: 'O nome e obrigatorio' })
	@MaxLength(255, { message: 'O nome deve ter no maximo 255 caracteres' })
	name: string

	@IsString({ message: 'A descricao deve ser uma string' })
	@IsNotEmpty({ message: 'A descricao e obrigatoria' })
	description: string

	@IsDefined({ message: 'O preco e obrigatorio' })
	@Type(() => Number)
	@IsNumber(
		{ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
		{ message: 'O preco deve ser um numero decimal com ate 2 casas' },
	)
	@Min(0.01, { message: 'O preco deve ser no minimo 0.01' })
	price: number

	@IsDefined({ message: 'O estoque e obrigatorio' })
	@Type(() => Number)
	@IsInt({ message: 'O estoque deve ser um numero inteiro' })
	@Min(0, { message: 'O estoque deve ser no minimo 0' })
	stock: number
}
