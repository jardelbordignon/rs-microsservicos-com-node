import { HttpService } from '@nestjs/axios'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { firstValueFrom } from 'rxjs'
import { serviceConfig } from '@/config/gateway.config'
import type {
	IAuthDto,
	IAuthResponse,
	IRegisterDto,
	IRegisterResponse,
	IUserSession,
} from '@/interfaces/auth.interface'

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly httpService: HttpService,
	) {}

	validateJwtToken(token: string): Promise<IAuthResponse> {
		try {
			return this.jwtService.verify(token)
		} catch {
			throw new UnauthorizedException('Invalid JWT token')
		}
	}

	async validateSessionToken(sessionToken: string): Promise<IUserSession> {
		try {
			const { data } = await firstValueFrom(
				this.httpService.get<IUserSession>(
					`${serviceConfig.users.url}/sessions/validate/${sessionToken}`,
					{ timeout: serviceConfig.users.timeout },
				),
			)
			return data
		} catch {
			throw new UnauthorizedException('Invalid session token')
		}
	}

	async login(dto: IAuthDto): Promise<IAuthResponse> {
		try {
			const { data } = await firstValueFrom(
				this.httpService.post(`${serviceConfig.users.url}/login`, dto, {
					timeout: serviceConfig.users.timeout,
				}),
			)
			return data
		} catch {
			throw new UnauthorizedException('Invalid login credentials')
		}
	}

	async register(dto: IRegisterDto): Promise<IRegisterResponse> {
		try {
			const { data } = await firstValueFrom(
				this.httpService.post(`${serviceConfig.users.url}/auth/register`, dto, {
					timeout: serviceConfig.users.timeout,
				}),
			)
			return data
		} catch {
			throw new UnauthorizedException('Registration failed')
		}
	}
}
