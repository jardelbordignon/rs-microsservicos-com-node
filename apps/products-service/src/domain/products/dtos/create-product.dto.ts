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
	@IsNotEmpty({ message: 'O nome é obrigatório' })
	@MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
	name: string

	@IsString({ message: 'A descrição deve ser uma string' })
	@IsNotEmpty({ message: 'A descrição é obrigatória' })
	description: string

	@IsDefined({ message: 'O preço é obrigatório' })
	@Type(() => Number)
	@IsNumber(
		{ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
		{ message: 'O preço deve ser um número decimal com até 2 casas' },
	)
	@Min(0.01, { message: 'O preço deve ser no mínimo 0.01' })
	price: number

	@IsDefined({ message: 'O estoque é obrigatório' })
	@Type(() => Number)
	@IsInt({ message: 'O estoque deve ser um número inteiro' })
	@Min(0, { message: 'O estoque deve ser no mínimo 0' })
	stock: number
}
