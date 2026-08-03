import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PaymentsModule } from '@/domain/payments/payments.module'
import { DlqController } from './dlq/dlq.controller'
import { DlqService } from './dlq/dlq.service'
import { MetricsController } from './metrics/metrics.controller'
import { MetricsService } from './metrics/metrics.service'
import { PaymentConsumerService } from './payment-consumer/payment-consumer.service'
import { PaymentQueueService } from './payment-queue/payment-queue.service'
import { PaymentResultPublisher } from './payment-result/payment-result.publisher'
import { RabbitmqService } from './rabbitmq/rabbitmq.service'

@Module({
	controllers: [DlqController, MetricsController],
	imports: [ConfigModule, PaymentsModule],
	providers: [
		RabbitmqService,
		PaymentQueueService,
		PaymentConsumerService,
		PaymentResultPublisher,
		DlqService,
		MetricsService,
	],
	exports: [RabbitmqService, PaymentQueueService, PaymentConsumerService],
})
export class EventsModule {}
