import { Module } from '@nestjs/common'
import { ProductsModule } from './products/products.module'
import { UsersModule } from './users/users.module'

@Module({
	imports: [UsersModule, ProductsModule],
	controllers: [],
})
export class DomainModule {}
