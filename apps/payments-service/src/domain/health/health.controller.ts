import { Controller, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import { Public } from '@/auth/decorators/public.decorator'
import { HealthService } from './health.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Public()
	@Endpoint({
		type: 'Get',
		summary: 'Verificar saude do products-service',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Saude retornada com sucesso',
				schema: {
					type: 'object',
					properties: {
						status: { type: 'string', example: 'ok' },
						service: {
							type: 'string',
							example: 'products-service',
						},
					},
				},
			},
		],
	})
	getHealth() {
		return this.healthService.getHealth()
	}
}
