import { Controller, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import { AppService } from './app.service'
import { Public } from './auth/decorators/public.decorator'

@ApiTags('Health')
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Endpoint({
		type: 'Get',
		path: 'health',
		summary: 'Health check do users-service',
		responses: [
			{ status: HttpStatus.OK, description: 'Users service está saudável' },
		],
	})
	@Public()
	getHealth() {
		return this.appService.getHealth()
	}
}
