import { Controller, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus'
import { Endpoint } from '@repo/utils'
import { Public } from '@/auth/decorators/public.decorator'

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private db: TypeOrmHealthIndicator,
	) {}

	@Public()
	@Endpoint({
		type: 'Get',
		summary: 'Health check do users-service',
		responses: [
			{ status: HttpStatus.OK, description: 'Users service está saudável' },
		],
	})
	@HealthCheck()
	getHealth() {
		return this.health.check([() => this.db.pingCheck('database')])
	}
}
