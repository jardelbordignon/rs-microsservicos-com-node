import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DlqController } from './dlq/dlq.controller'
import { DlqService } from './dlq/dlq.service'
import { PaymentConsumerService } from './payment-consumer/payment-consumer.service'
import { PaymentQueueService } from './payment-queue/payment-queue.service'
import { RabbitmqService } from './rabbitmq/rabbitmq.service'

@Module({
	controllers: [DlqController],
	imports: [ConfigModule],
	providers: [
		RabbitmqService,
		PaymentQueueService,
		PaymentConsumerService,
		DlqService,
	],
	exports: [RabbitmqService, PaymentQueueService, PaymentConsumerService],
})
export class EventsModule {}
