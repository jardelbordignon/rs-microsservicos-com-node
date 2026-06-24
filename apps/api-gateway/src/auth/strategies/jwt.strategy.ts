import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthService } from '../services/auth.service'

interface JwtPayload {
	sub: string
	email: string
	role: string
	token: string
	iat?: number
	exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly authService: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET ?? '',
		})
	}

	async validate({ token, email, role, sub: userId }: JwtPayload) {
		if (!token) {
			throw new UnauthorizedException('Invalid token payload')
		}

		const user = await this.authService.validateJwtToken(token)

		if (!user) {
			throw new UnauthorizedException('Invalid jwt token')
		}

		return { userId, email, role }
	}
}
