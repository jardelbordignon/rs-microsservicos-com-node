import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './service/auth.service'

@Module({
	imports: [
		PassportModule,
		HttpModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (env: ConfigService) => ({
				secret: env.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '24h' },
			}),
		}),
	],
	providers: [AuthService],
	exports: [],
})
export class AuthModule {}
