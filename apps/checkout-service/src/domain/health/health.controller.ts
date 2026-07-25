import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@/auth/decorators/public.decorator'
import { HealthService } from './health.service'

@ApiTags('Health')
@ApiBearerAuth()
@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Public()
	@Get()
	@ApiOperation({ summary: 'Verificar saúde do checkout-service' })
	@ApiOkResponse({
		description: 'Saúde retornada com sucesso',
		schema: {
			type: 'object',
			properties: {
				status: { type: 'string', example: 'ok' },
				service: { type: 'string', example: 'checkout-service' },
			},
		},
	})
	getHealth() {
		return this.healthService.getHealth()
	}
}
