import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { IUserInfo } from '@/interfaces/auth.interface'

type JwtPayload = {
	sub: string
	email: string
	role: IUserInfo['role']
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
		})
	}

	validate(payload: JwtPayload): IUserInfo {
		return {
			id: payload.sub,
			email: payload.email,
			role: payload.role,
		}
	}
}
