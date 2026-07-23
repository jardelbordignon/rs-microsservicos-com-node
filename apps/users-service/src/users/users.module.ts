import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtStrategy } from '../auth/strategies/jwt.strategy'
import { User } from './entities/user.entity'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		PassportModule,
		JwtModule.registerAsync({
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [UsersController],
	providers: [UsersService, JwtStrategy],
})
export class UsersModule {}
