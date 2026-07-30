import { Module } from '@nestjs/common'
import { CheckoutModule } from './checkout/checkout.module'
import { HealthModule } from './health/health.module'
import { ProductsModule } from './products/products.module'
import { UsersModule } from './users/users.module'

@Module({
	imports: [HealthModule, ProductsModule, UsersModule, CheckoutModule],
	controllers: [],
})
export class DomainModule {}
