import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { OrdersModule } from '@/domain/orders/orders.module'
import { PaymentQueueService } from './payment-queue/payment-queue.service'
import { PaymentResultConsumerService } from './payment-result/payment-result-consumer.service'
import { PaymentResultQueueService } from './payment-result/payment-result-queue.service'
import { RabbitmqService } from './rabbitmq/rabbitmq.service'

@Module({
	imports: [ConfigModule, forwardRef(() => OrdersModule)],
	providers: [
		RabbitmqService,
		PaymentQueueService,
		PaymentResultQueueService,
		PaymentResultConsumerService,
	],
	exports: [RabbitmqService, PaymentQueueService, PaymentResultQueueService],
})
export class EventsModule {}
