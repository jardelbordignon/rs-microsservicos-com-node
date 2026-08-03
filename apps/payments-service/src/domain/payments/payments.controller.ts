import { Controller, HttpStatus, Param, ParseUUIDPipe } from '@nestjs/common'
import { Endpoint } from '@repo/utils'
import { PaymentsService } from './payments.service'

@Controller('payments')
export class PaymentsController {
	constructor(private readonly paymentsService: PaymentsService) {}

	@Endpoint({
		type: 'Get',
		path: ':orderId',
		summary: 'Consultar status de pagamento por orderId',
		responses: [
			{ status: HttpStatus.OK, description: 'Pagamento encontrado' },
			{ status: HttpStatus.NOT_FOUND, description: 'Pagamento nao encontrado' },
		],
	})
	findByOrderId(@Param('orderId', new ParseUUIDPipe()) orderId: string) {
		return this.paymentsService.findByOrderId(orderId)
	}
}
