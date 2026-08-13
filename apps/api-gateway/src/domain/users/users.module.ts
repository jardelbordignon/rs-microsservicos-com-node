import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
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
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
			}),
		}),
	],
	controllers: [UsersController],
	providers: [UsersService, JwtStrategy],
})
export class UsersModule {}
