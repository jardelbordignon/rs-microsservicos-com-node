import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import type { FastifyRequest } from 'fastify'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from '@/domain/users/users.service'

interface JwtPayload {
	sub: string
	email: string
	role: string
	iat?: number
	exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly usersService: UsersService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			passReqToCallback: true,
			secretOrKey: process.env.JWT_SECRET ?? '',
		})
	}

	async validate(request: FastifyRequest, _payload: JwtPayload) {
		const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request)

		if (!token) {
			throw new UnauthorizedException('Invalid JWT token')
		}

		const user = await this.usersService.validateJwtToken(token)

		if (!user) {
			throw new UnauthorizedException('Invalid jwt token')
		}

		return user
	}
}
