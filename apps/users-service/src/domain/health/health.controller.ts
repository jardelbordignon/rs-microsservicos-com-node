import { Controller, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import { Public } from '@/auth/decorators/public.decorator'
import { HealthService } from './health.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Endpoint({
		type: 'Get',
		summary: 'Health check do users-service',
		responses: [
			{ status: HttpStatus.OK, description: 'Users service está saudável' },
		],
	})
	@Public()
	getHealth() {
		return this.healthService.getHealth()
	}
}
