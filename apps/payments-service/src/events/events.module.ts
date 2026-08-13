import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MetricsModule } from '@/domain/metrics/metrics.module'
import { PaymentsModule } from '@/domain/payments/payments.module'
import { DlqController } from './dlq/dlq.controller'
import { DlqService } from './dlq/dlq.service'
import { MetricsService } from './metrics/metrics.service'
import { PaymentConsumerService } from './payment-consumer/payment-consumer.service'
import { PaymentQueueService } from './payment-queue/payment-queue.service'
import { PaymentResultPublisher } from './payment-result/payment-result.publisher'
import { RabbitmqService } from './rabbitmq/rabbitmq.service'

@Module({
	controllers: [DlqController],
	imports: [ConfigModule, PaymentsModule, MetricsModule],
	providers: [
		DlqService,
		MetricsService,
		PaymentConsumerService,
		PaymentQueueService,
		PaymentResultPublisher,
		RabbitmqService,
	],
	exports: [
		MetricsService,
		PaymentQueueService,
		PaymentConsumerService,
		RabbitmqService,
	],
})
export class EventsModule {}
