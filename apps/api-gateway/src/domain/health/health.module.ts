import { Module } from '@nestjs/common'
import { HealthCheckModule } from '@/common/health-check/health-check.module'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'

@Module({
	imports: [HealthCheckModule],
	controllers: [HealthController],
	providers: [HealthService],
})
export class HealthModule {}
