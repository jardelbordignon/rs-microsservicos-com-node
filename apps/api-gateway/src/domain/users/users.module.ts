import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from '@/auth/strategies/jwt.strategy'
import { ProxyModule } from '@/proxy/proxy.module'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
	imports: [
		ProxyModule,
		HttpModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.register({
			secret: process.env.JWT_SECRET ?? '',
		}),
	],
	controllers: [UsersController],
	providers: [UsersService, JwtStrategy],
})
export class UsersModule {}
