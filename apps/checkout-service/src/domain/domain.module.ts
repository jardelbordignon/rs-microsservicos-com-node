import { Module } from '@nestjs/common'
import { AuthModule } from '@/auth/auth.module'
import { CartModule } from './cart/cart.module'
import { HealthModule } from './health/health.module'
import { OrdersModule } from './orders/orders.module'

@Module({
	imports: [AuthModule, CartModule, OrdersModule, HealthModule],
})
export class DomainModule {}
