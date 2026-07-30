import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsUUID, Min } from 'class-validator'

export class AddOrRemoveCartItemDto {
	@ApiProperty({
		description: 'Identificador do produto',
		format: 'uuid',
	})
	@IsUUID('4', { message: 'productId deve ser um UUID valido' })
	productId: string

	@ApiProperty({
		description: 'Quantidade do produto no carrinho',
		minimum: 1,
		example: 2,
	})
	@Type(() => Number)
	@IsInt({ message: 'quantity deve ser um numero inteiro' })
	@Min(1, { message: 'quantity deve ser maior ou igual a 1' })
	quantity: number
}
