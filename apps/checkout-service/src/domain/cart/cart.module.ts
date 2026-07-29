import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CartController } from './cart.controller'
import { CartService } from './cart.service'
import { Cart } from './entities/cart.entity'
import { CartItem } from './entities/cart-item.entity'
import { ProductsClientService } from './products-client.service'

@Module({
	imports: [TypeOrmModule.forFeature([Cart, CartItem]), HttpModule],
	controllers: [CartController],
	providers: [CartService, ProductsClientService],
	exports: [CartService],
})
export class CartModule {}
