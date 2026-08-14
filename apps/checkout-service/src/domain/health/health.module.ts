import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { EventsModule } from '@/events/events.module'
import { HealthController } from './health.controller'
import { RabbitMQHealthIndicator } from './rabbitmq.health-indicator'

@Module({
	imports: [TerminusModule, EventsModule],
	controllers: [HealthController],
	providers: [RabbitMQHealthIndicator],
})
export class HealthModule {}
