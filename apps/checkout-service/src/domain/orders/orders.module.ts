import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventsModule } from '@/events/events.module'
import { CartModule } from '../cart/cart.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { Order } from './entities/order.entity'

@Module({
	imports: [TypeOrmModule.forFeature([Order]), CartModule, forwardRef(() => EventsModule)],
	controllers: [OrdersController],
	providers: [OrdersService],
	exports: [OrdersService],
})
export class OrdersModule {}
