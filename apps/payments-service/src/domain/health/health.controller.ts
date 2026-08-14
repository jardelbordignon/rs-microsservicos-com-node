import { Controller, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
	HealthCheck,
	HealthCheckService,
	TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import { Endpoint } from '@repo/utils'
import { Public } from '@/auth/decorators/public.decorator'
import { RabbitMQHealthIndicator } from './rabbitmq.health-indicator'

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private db: TypeOrmHealthIndicator,
		private rabbitmq: RabbitMQHealthIndicator,
	) {}

	@Public()
	@Endpoint({
		type: 'Get',
		summary: 'Verificar saude do products-service',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Saude retornada com sucesso',
			},
		],
	})
	@HealthCheck()
	getHealth() {
		return this.health.check([
			() => this.db.pingCheck('database'),
			() => this.rabbitmq.isHealthy('rabbitmq'),
		])
	}
}
