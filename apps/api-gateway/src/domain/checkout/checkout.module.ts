import { Module } from '@nestjs/common'
import { ProxyModule } from '@/proxy/proxy.module'
import { CartProxyController } from './cart-proxy.controller'
import { CheckoutProxyService } from './checkout-proxy.service'
import { OrdersProxyController } from './orders-proxy.controller'

@Module({
	imports: [ProxyModule],
	controllers: [CartProxyController, OrdersProxyController],
	providers: [CheckoutProxyService],
})
export class CheckoutModule {}
