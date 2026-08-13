import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { EPaymentMethod } from '../enums/payment-method.enum'

export class CheckoutCartDto {
	@ApiProperty({
		description: 'Metodo de pagamento do pedido',
		enum: EPaymentMethod,
	})
	@IsEnum(EPaymentMethod, {
		message: 'paymentMethod deve ser um metodo de pagamento valido',
	})
	paymentMethod: EPaymentMethod
}
