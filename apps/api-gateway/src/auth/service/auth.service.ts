import { HttpService } from '@nestjs/axios'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { firstValueFrom } from 'rxjs'
import { serviceConfig } from 'src/config/gateway.config'

type TUserSession = {
	valid: boolean
	user: {
		id: string
		email: string
		firstName: string
		lastName: string
		role: string
		status: string
	} | null
}

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly httpService: HttpService,
	) {}

	validateJwtToken(token: string): Promise<any> {
		try {
			return this.jwtService.verify(token)
		} catch (error) {
			throw new UnauthorizedException('Invalid JWT token')
		}
	}

	async validateSessionToken(sessionToken: string): Promise<TUserSession> {
		try {
			const { data } = await firstValueFrom(
				this.httpService.get<TUserSession>(
					`${serviceConfig.users.url}/sessions/validate/${sessionToken}`,
					{ timeout: serviceConfig.users.timeout },
				),
			)
			return data
		} catch (error) {
			throw new UnauthorizedException('Invalid session token')
		}
	}

	async login(dto: { email: string; password: string }) {
		try {
			const { data } = await firstValueFrom(
				this.httpService.post(`${serviceConfig.users.url}/login`, dto, {
					timeout: serviceConfig.users.timeout,
				}),
			)
			return data
		} catch (error) {
			throw new UnauthorizedException('Invalid login credentials')
		}
	}

	async register(dto: any) {
		try {
			const { data } = await firstValueFrom(
				this.httpService.post(`${serviceConfig.users.url}/auth/register`, dto, {
					timeout: serviceConfig.users.timeout,
				}),
			)
			return data
		} catch (error) {
			throw new UnauthorizedException('Registration failed')
		}
	}
}
